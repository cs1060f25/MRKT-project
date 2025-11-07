/**
 * API Route: Create Listing
 *
 * Server-side endpoint for creating event listings (asks).
 * Uses Clerk authentication and Supabase service role to bypass RLS.
 *
 * Flow:
 * 1. Verify Clerk authentication
 * 2. Validate and sanitize inputs
 * 3. Ensure user exists in database (upsert from Clerk data)
 * 4. Generate UUID for ask
 * 5. Insert ask into database
 * 6. Return ask ID
 */

import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/server/serviceClient'
import { ensureUserExists } from '@/lib/supabase/users'

/**
 * Map Postgres error codes to user-friendly messages
 */
function mapDatabaseError(error: any): string {
  const code = error.code || error.error_code

  switch (code) {
    case '23503': // foreign_key_violation
      if (error.message?.includes('event_id')) {
        return 'The selected event does not exist. Please refresh and try again.'
      }
      return 'Invalid reference to related data.'

    case '23514': // check_constraint_violation
      if (error.message?.includes('price_cents')) {
        return 'Price must be greater than 0.'
      }
      if (error.message?.includes('qty')) {
        return 'Quantity must be greater than 0.'
      }
      return 'Data validation failed. Please check your inputs.'

    case '23505': // unique_violation
      return 'This listing already exists.'

    case '23502': // not_null_violation
      return 'Missing required data. Please fill out all fields.'

    default:
      return error.message || 'Failed to create listing. Please try again.'
  }
}

export async function POST(request: NextRequest) {
  try {
    // ========================================================================
    // 1. Verify Authentication
    // ========================================================================
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to create a listing.' },
        { status: 401 }
      )
    }

    // ========================================================================
    // 2. Parse and Validate Request Body
    // ========================================================================
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid request format. Expected JSON.' },
        { status: 400 }
      )
    }

    const { event_id, price_cents, qty } = body

    // Validate required fields
    const missingFields = []
    if (!event_id) missingFields.push('event_id')
    if (price_cents === undefined || price_cents === null) missingFields.push('price_cents')
    if (qty === undefined || qty === null) missingFields.push('qty')

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate data types
    if (typeof event_id !== 'string') {
      return NextResponse.json(
        { error: 'event_id must be a string (UUID)' },
        { status: 400 }
      )
    }

    if (typeof price_cents !== 'number' || !Number.isInteger(price_cents)) {
      return NextResponse.json(
        { error: 'price_cents must be an integer' },
        { status: 400 }
      )
    }

    if (typeof qty !== 'number' || !Number.isInteger(qty)) {
      return NextResponse.json(
        { error: 'qty must be an integer' },
        { status: 400 }
      )
    }

    // Validate value ranges
    if (price_cents <= 0) {
      return NextResponse.json(
        { error: 'price_cents must be greater than 0' },
        { status: 400 }
      )
    }

    if (qty <= 0) {
      return NextResponse.json(
        { error: 'qty must be greater than 0' },
        { status: 400 }
      )
    }

    // Validate UUID format for event_id
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(event_id)) {
      return NextResponse.json(
        { error: 'event_id must be a valid UUID' },
        { status: 400 }
      )
    }

    // ========================================================================
    // 3. Get Clerk User Data and Ensure User Exists in Database
    // ========================================================================
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json(
        { error: 'Unable to fetch user data from Clerk' },
        { status: 500 }
      )
    }

    const userEmail = clerkUser.emailAddresses[0]?.emailAddress
    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found. Please update your profile.' },
        { status: 400 }
      )
    }

    const userName = [clerkUser.firstName, clerkUser.lastName]
      .filter(Boolean)
      .join(' ') || undefined

    // Get service role client (bypasses RLS)
    const supabase = getServiceClient({ functionName: 'create-listing-api' })

    // Ensure user exists in database
    try {
      await ensureUserExists(supabase, userId, userEmail, userName)
    } catch (userError) {
      console.error('[API] Failed to ensure user exists:', userError)
      return NextResponse.json(
        { error: 'Failed to sync user data. Please try again.' },
        { status: 500 }
      )
    }

    // ========================================================================
    // 4. Generate UUID for Ask and QR Storage Path
    // ========================================================================
    const askId = crypto.randomUUID()

    // Generate proper storage path: {event_id}/{ask_id}/qr.png
    // User will upload file to this path after ask creation
    const qrStoragePath = `${event_id}/${askId}/qr.png`

    // ========================================================================
    // 5. Insert Ask into Database
    // ========================================================================
    const { data: ask, error: insertError } = await supabase
      .from('asks')
      .insert({
        id: askId,
        seller_id: userId,
        event_id,
        price_cents,
        qty,
        qr_storage_path: qrStoragePath,
        status: 'open',
      })
      .select('id, event_id, price_cents, qty, status, created_at')
      .single()

    if (insertError) {
      console.error('[API] Database error creating ask:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
      })

      const userFriendlyError = mapDatabaseError(insertError)
      return NextResponse.json(
        { error: userFriendlyError },
        { status: 500 }
      )
    }

    if (!ask) {
      console.error('[API] Ask insert returned no data')
      return NextResponse.json(
        { error: 'Listing created but unable to retrieve details' },
        { status: 500 }
      )
    }

    // ========================================================================
    // 6. Return Success Response
    // ========================================================================
    console.log(`[API] Successfully created ask ${ask.id} for user ${userId}`)

    return NextResponse.json({
      askId: ask.id,
      error: null,
      uploadPath: qrStoragePath, // Path where client should upload QR code
      ask: {
        id: ask.id,
        eventId: ask.event_id,
        priceCents: ask.price_cents,
        qty: ask.qty,
        status: ask.status,
        createdAt: ask.created_at,
      },
    })
  } catch (err) {
    console.error('[API] Unexpected error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
