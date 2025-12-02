/**
 * Dashboard Page
 *
 * Authenticated dashboard with four sections:
 * - Market (Events)
 * - My Bids
 * - My Listings (Asks)
 * - My Tickets
 *
 * All data fetched server-side with RLS enforcement.
 */

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@/lib/supabase/server'
import { SignedIn, SignedOut, UserButton, SignInButton } from '@clerk/nextjs'
import {
  getUpcomingEvents,
  getUserBids,
  getUserListings,
  getUserTickets,
  getBookPreview,
} from '@/lib/dashboard/queries'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import type { BookEntry } from '@/lib/dashboard/types'

export const metadata = {
  title: 'Dashboard | MRKT',
  description: 'Your marketplace dashboard for HBS events',
}

export default async function DashboardPage() {
  // ============================================================================
  // Authentication Check
  // ============================================================================
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // ============================================================================
  // Create RLS-aware Supabase Client
  // ============================================================================
  const cookieStore = await cookies()
  const supabase = createServerClient(cookieStore)

  // ============================================================================
  // Fetch Data (Parallel)
  // ============================================================================
  const [eventsResult, bidsResult, listingsResult, ticketsResult] =
    await Promise.all([
      getUpcomingEvents(supabase),
      getUserBids(supabase, userId),
      getUserListings(supabase, userId),
      getUserTickets(supabase, userId),
    ])

  // ============================================================================
  // Optional: Fetch Book Previews for First 3 Events
  // ============================================================================
  const bookPreviews = new Map<string, BookEntry[]>()

  if (eventsResult.data.length > 0) {
    // Only fetch book for first 3 events to reduce load
    const eventsToPreview = eventsResult.data.slice(0, 3)

    await Promise.all(
      eventsToPreview.map(async (event) => {
        const bookResult = await getBookPreview(supabase, event.id)
        if (bookResult.data.length > 0) {
          bookPreviews.set(event.id, bookResult.data)
        }
      })
    )
  }

  // ============================================================================
  // Collect Errors
  // ============================================================================
  const errors = {
    events: eventsResult.error || undefined,
    bids: bidsResult.error || undefined,
    listings: listingsResult.error || undefined,
    tickets: ticketsResult.error || undefined,
  }

  // ============================================================================
  // Render Dashboard
  // ============================================================================
  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Repositioned auth controls (top-right) */}
      <div className="absolute right-4 top-4 z-50 flex items-center gap-3">
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">
            <button
              type="button"
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600/60"
              aria-label="Log in"
            >
              Log in
            </button>
          </SignInButton>
        </SignedOut>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            View upcoming events, manage your bids and listings, and access your tickets.
          </p>
        </div>

        {/* Dashboard Content */}
        <DashboardLayout
          events={eventsResult.data}
          bids={bidsResult.data}
          listings={listingsResult.data}
          tickets={ticketsResult.data}
          bookPreviews={bookPreviews}
          errors={errors}
        />
      </div>
    </div>
  )
}
