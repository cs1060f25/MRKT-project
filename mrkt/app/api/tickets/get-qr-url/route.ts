/**
 * Get QR Code URL API
 *
 * Generates a signed URL for viewing a ticket's QR code image.
 * Uses RLS to ensure only the ticket winner can access their QR code.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/lib/supabase/server'
import { getQRCodeURL, QR_CODES_BUCKET } from '@/lib/supabase/storage'

export async function POST(request: NextRequest) {
  try {
    const { userId, getToken } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { storagePath } = body

    if (!storagePath || typeof storagePath !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid storagePath' },
        { status: 400 }
      )
    }

    // Create Supabase client with user's JWT for RLS
    const cookieStore = await cookies()
    const token = await getToken({ template: 'supabase' })
    const supabase = createServerClient(cookieStore, token || undefined)

    // Verify user owns this ticket (RLS will enforce this, but let's be explicit)
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id, winner_id, qr_storage_path')
      .eq('qr_storage_path', storagePath)
      .eq('winner_id', userId)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: 'Ticket not found or access denied' },
        { status: 404 }
      )
    }

    // Generate signed URL (expires in 1 hour)
    const url = await getQRCodeURL(supabase, storagePath, 3600)

    if (!url) {
      return NextResponse.json(
        { error: 'Failed to generate URL for ticket image' },
        { status: 500 }
      )
    }

    return NextResponse.json({ url })

  } catch (error) {
    console.error('Get QR URL error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
