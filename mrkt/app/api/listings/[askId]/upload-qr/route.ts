/**
 * API Route: Upload QR Code for Listing
 *
 * Server-side endpoint for uploading QR codes to storage.
 * Uses service role to bypass RLS and manually validates ownership.
 *
 * Flow:
 * 1. Verify Clerk authentication
 * 2. Validate ask exists and belongs to user
 * 3. Validate file (type, size)
 * 4. Upload to Supabase Storage using service role
 * 5. Return success
 */

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/server/serviceClient'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ askId: string }> }
) {
  try {
    // ========================================================================
    // 1. Verify Authentication
    // ========================================================================
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      )
    }

    const { askId } = await params

    // ========================================================================
    // 2. Get Form Data (File Upload)
    // ========================================================================
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const eventId = formData.get('eventId') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      )
    }

    // ========================================================================
    // 3. Validate File
    // ========================================================================
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      )
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PNG, JPEG, and PDF are allowed.' },
        { status: 400 }
      )
    }

    // ========================================================================
    // 4. Verify Ask Ownership
    // ========================================================================
    const supabase = getServiceClient({ functionName: 'upload-qr-api' })

    const { data: ask, error: askError } = await supabase
      .from('asks')
      .select('id, seller_id, event_id')
      .eq('id', askId)
      .single()

    if (askError || !ask) {
      console.error('[Upload QR] Ask not found:', askError)
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (ask.seller_id !== userId) {
      console.error('[Upload QR] Unauthorized: user does not own ask')
      return NextResponse.json(
        { error: 'You do not own this listing' },
        { status: 403 }
      )
    }

    // Verify event_id matches
    if (ask.event_id !== eventId) {
      console.error('[Upload QR] Event ID mismatch')
      return NextResponse.json(
        { error: 'Event ID mismatch' },
        { status: 400 }
      )
    }

    // ========================================================================
    // 5. Determine File Extension and Storage Path
    // ========================================================================
    let extension = 'png'
    if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
      extension = 'jpeg'
    } else if (file.type === 'application/pdf') {
      extension = 'pdf'
    }

    const storagePath = `${eventId}/${askId}/qr.${extension}`

    // ========================================================================
    // 6. Upload to Storage (Service Role bypasses RLS)
    // ========================================================================
    const fileBuffer = await file.arrayBuffer()
    const fileBytes = new Uint8Array(fileBuffer)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('qr_codes')
      .upload(storagePath, fileBytes, {
        contentType: file.type,
        upsert: true, // Allow replacing existing file
      })

    if (uploadError) {
      console.error('[Upload QR] Storage error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file. Please try again.' },
        { status: 500 }
      )
    }

    // ========================================================================
    // 7. Return Success
    // ========================================================================
    console.log(`[Upload QR] Successfully uploaded ${storagePath} for ask ${askId}`)

    return NextResponse.json({
      success: true,
      path: uploadData.path,
    })
  } catch (err) {
    console.error('[Upload QR] Unexpected error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
