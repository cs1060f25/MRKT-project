/**
 * Sell Page - Create Listing
 *
 * Authenticated page for sellers to create event listings (asks).
 * Fetches upcoming events server-side and renders CreateListingForm.
 * Premium dark theme styling.
 */

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@/lib/supabase/server'
import { getUpcomingEvents } from '@/lib/dashboard/queries'
import { CreateListingForm } from '@/components/sell/CreateListingForm'
import Link from 'next/link'

export const metadata = {
  title: 'Create Listing | MRKT',
  description: 'List your event tickets for sale',
}

export default async function SellCreatePage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>
}) {
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
  // Fetch Upcoming Events
  // ============================================================================
  const eventsResult = await getUpcomingEvents(supabase)

  // ============================================================================
  // Validate URL eventId Parameter
  // ============================================================================
  const { eventId: urlEventId } = await searchParams

  // Only pre-select if the eventId exists in the fetched events (which are already future-only)
  const preselectedEventId = urlEventId && eventsResult.data.some(e => e.id === urlEventId)
    ? urlEventId
    : undefined

  // ============================================================================
  // Render Create Listing Form
  // ============================================================================
  return (
    <div className="min-h-screen bg-[var(--color-charcoal)]">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-white/50 mb-4">
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <span className="text-white/30">›</span>
            <span className="text-white/70">Create Listing</span>
          </div>
          <div className="elegant-divider mb-4" />
          <h1 className="font-[var(--font-playfair)] text-3xl font-bold text-white">Create Listing</h1>
          <p className="mt-2 text-sm text-white/60">
            List your event tickets for sale on the marketplace
          </p>
        </div>

        {/* Error Banner for Events Fetch */}
        {eventsResult.error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-400">
                  Failed to load events
                </h3>
                <div className="mt-2 text-sm text-red-300/80">
                  <p>{eventsResult.error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Container */}
        <div className="glass rounded-2xl border border-white/10 p-6">
          {eventsResult.data.length === 0 && !eventsResult.error ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-white/30"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-semibold text-white">
                No upcoming events
              </h3>
              <p className="mt-1 text-sm text-white/50">
                There are no upcoming events available to list tickets for.
              </p>
            </div>
          ) : (
            <CreateListingForm
              events={eventsResult.data.map((event) => ({
                id: event.id,
                title: event.title,
                starts_at: event.starts_at,
                org: event.org,
              }))}
              preselectedEventId={preselectedEventId}
            />
          )}
        </div>
      </div>
    </div>
  )
}
