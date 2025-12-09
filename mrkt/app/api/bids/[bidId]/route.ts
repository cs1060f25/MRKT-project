/**
 * API Route: Delete Bid
 *
 * Allows an authenticated user to delete their own bid if it is still open.
 * This uses the RLS-aware Supabase client so that Row Level Security policies
 * enforce ownership and status checks.
 *
 * Flow:
 * 1. Verify Clerk authentication
 * 2. Validate bidId param format
 * 3. Perform DELETE with RLS (only buyer and status='open' can delete)
 * 4. Return result
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@/lib/supabase/server'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ bidId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      )
    }

    const { bidId } = await params

    if (!bidId || !UUID_REGEX.test(bidId)) {
      return NextResponse.json(
        { error: 'Invalid bidId. Must be a UUID.' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(cookieStore)

    // RLS will ensure that only the owner can delete and only if status='open'
    const { data, error } = await supabase
      .from('bids')
      .delete()
      .eq('id', bidId)
      .select('id')

    if (error) {
      console.error('[/api/bids/[bidId]] Delete error:', error)
      return NextResponse.json(
        { error: 'Failed to delete bid. Please try again.' },
        { status: 500 }
      )
    }

    // If no rows were deleted, either it does not exist, not owned by user,
    // or not in a deletable state per RLS. Return 404 to avoid leaking details.
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Bid not found or cannot be deleted.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, id: data[0].id })
  } catch (err) {
    console.error('[/api/bids/[bidId]] Unexpected error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}


