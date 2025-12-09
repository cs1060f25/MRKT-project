/**
 * API Route: Delete Listing (Ask)
 *
 * Allows an authenticated seller to delete their own listing if it is still open.
 * Uses the RLS-aware Supabase client so that policies enforce ownership and status.
 *
 * Flow:
 * 1. Verify Clerk authentication
 * 2. Validate askId param format
 * 3. Perform DELETE with RLS (only seller and status='open' can delete)
 * 4. Return result
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@/lib/supabase/server'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ askId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      )
    }

    const { askId } = await params

    if (!askId || !UUID_REGEX.test(askId)) {
      return NextResponse.json(
        { error: 'Invalid askId. Must be a UUID.' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(cookieStore)

    // RLS ensures only seller can delete and only if status='open'
    const { data, error } = await supabase
      .from('asks')
      .delete()
      .eq('id', askId)
      .select('id')

    if (error) {
      console.error('[/api/listings/[askId]] Delete error:', error)
      return NextResponse.json(
        { error: 'Failed to delete listing. Please try again.' },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Listing not found or cannot be deleted.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, id: data[0].id })
  } catch (err) {
    console.error('[/api/listings/[askId]] Unexpected error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}


