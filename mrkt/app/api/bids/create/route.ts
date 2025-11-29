/**
 * Create Bid API Route
 * 
 * Uses Clerk auth + Supabase service role to create a bid
 * Validates that the user is creating a bid for themselves
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getServiceClient } from '@/lib/supabase/server'

// Input validation helpers
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_PRICE_CENTS = 1_000_000 // $10,000
const MAX_QTY = 100

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
    const { eventId, priceCents, qty, buyerId } = body

    if (!eventId || typeof eventId !== 'string' || !UUID_REGEX.test(eventId)) {
      return NextResponse.json(
        { error: 'Invalid eventId. Must be a UUID string.' },
        { status: 400 }
      )
    }

    if (
      typeof priceCents !== 'number' ||
      !Number.isFinite(priceCents) ||
      !Number.isSafeInteger(priceCents) ||
      priceCents <= 0
    ) {
      return NextResponse.json(
        { error: 'Invalid priceCents. Must be a positive integer (in cents).' },
        { status: 400 }
      )
    }
    if (priceCents > MAX_PRICE_CENTS) {
      return NextResponse.json(
        { error: 'Price exceeds maximum allowed ($10,000).' },
        { status: 400 }
      )
    }

    if (
      typeof qty !== 'number' ||
      !Number.isFinite(qty) ||
      !Number.isSafeInteger(qty) ||
      qty <= 0
    ) {
      return NextResponse.json(
        { error: 'Invalid quantity. Must be a positive integer.' },
        { status: 400 }
      )
    }
    if (qty > MAX_QTY) {
      return NextResponse.json(
        { error: 'Quantity exceeds maximum allowed (100 tickets).' },
        { status: 400 }
      )
    }

    if (!buyerId || typeof buyerId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid buyerId' },
        { status: 400 }
      )
    }

    // 3. Validate user is creating bid for themselves
    if (buyerId !== userId) {
      return NextResponse.json(
        { error: 'You can only create bids for yourself' },
        { status: 403 }
      )
    }

    // 4. Get service client (bypasses RLS)
    const supabase = getServiceClient({
      functionName: 'create-bid-api',
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
        console.error('[/api/bids/create] Failed to create user:', createUserError)
        return NextResponse.json(
          { error: 'Failed to initialize user account' },
          { status: 500 }
        )
      }
    }

    // 6. Verify event exists
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, ends_at')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }
    // Disallow bidding on events that have ended
    if (event.ends_at && new Date(event.ends_at).getTime() <= Date.now()) {
      return NextResponse.json(
        { error: 'Bidding closed: event has already ended.' },
        { status: 400 }
      )
    }

    // 7. Create the bid
    const bidId = crypto.randomUUID()
    
    const { data: bid, error: bidError } = await supabase
      .from('bids')
      .insert({
        id: bidId,
        event_id: eventId,
        buyer_id: buyerId,
        price_cents: priceCents,
        qty: qty,
        status: 'open',
      })
      .select()
      .single()

    if (bidError) {
      console.error('[/api/bids/create] Failed to create bid:', bidError)
      return NextResponse.json(
        { error: `Failed to create bid: ${bidError.message}` },
        { status: 500 }
      )
    }

    // 8. Return success
    return NextResponse.json({
      success: true,
      bid: bid,
    })

  } catch (error: any) {
    console.error('[/api/bids/create] Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

