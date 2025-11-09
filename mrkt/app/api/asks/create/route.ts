/**
 * Create Ask API Route
 * 
 * Uses Clerk auth + Supabase service role to create an ask
 * Validates that the user is creating an ask for themselves
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // 1. Verify Clerk session
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in.' },
        { status: 401 }
      )
    }

    // 2. Parse and validate input
    const body = await request.json()
    const { eventId, priceCents, qty, qrStoragePath, sellerId } = body

    if (!eventId || typeof eventId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid eventId' },
        { status: 400 }
      )
    }

    if (!priceCents || typeof priceCents !== 'number' || priceCents <= 0) {
      return NextResponse.json(
        { error: 'Invalid price. Must be a positive number.' },
        { status: 400 }
      )
    }

    if (!qty || typeof qty !== 'number' || qty <= 0) {
      return NextResponse.json(
        { error: 'Invalid quantity. Must be a positive number.' },
        { status: 400 }
      )
    }

    if (!qrStoragePath || typeof qrStoragePath !== 'string') {
      return NextResponse.json(
        { error: 'Invalid QR storage path' },
        { status: 400 }
      )
    }

    if (!sellerId || typeof sellerId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid sellerId' },
        { status: 400 }
      )
    }

    // 3. Validate user is creating ask for themselves
    if (sellerId !== userId) {
      return NextResponse.json(
        { error: 'You can only create asks for yourself' },
        { status: 403 }
      )
    }

    // 4. Get service client (bypasses RLS)
    const supabase = getServiceClient({
      functionName: 'create-ask-api',
      traceId: request.headers.get('x-request-id') || crypto.randomUUID()
    })

    // 5. Ensure user exists in database
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (!existingUser) {
      // Auto-create user if doesn't exist
      const { error: createUserError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: `${userId}@clerk.user`, // Placeholder email
          full_name: 'User',
        })

      if (createUserError) {
        console.error('[/api/asks/create] Failed to create user:', createUserError)
        return NextResponse.json(
          { error: 'Failed to initialize user account' },
          { status: 500 }
        )
      }
    }

    // 6. Verify event exists
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // 7. Create the ask
    const askId = crypto.randomUUID()
    
    const { data: ask, error: askError } = await supabase
      .from('asks')
      .insert({
        id: askId,
        event_id: eventId,
        seller_id: sellerId,
        price_cents: priceCents,
        qty: qty,
        qr_storage_path: qrStoragePath,
        status: 'open',
      })
      .select()
      .single()

    if (askError) {
      console.error('[/api/asks/create] Failed to create ask:', askError)
      return NextResponse.json(
        { error: `Failed to create ask: ${askError.message}` },
        { status: 500 }
      )
    }

    // 8. Return success
    return NextResponse.json({
      success: true,
      ask: ask,
    })

  } catch (error: any) {
    console.error('[/api/asks/create] Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

