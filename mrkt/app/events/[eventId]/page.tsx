/**
 * Event Details Page
 *
 * Public page displaying event information, current market activity (order book),
 * and executed transaction history (matches).
 *
 * Route: /events/[eventId]
 */

import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@/lib/supabase/server'
import { getEventDetails, getEventMatches } from '@/lib/events/queries'
import { getOrderBook } from '@/lib/supabase/rpc'
import { EventHeader } from '@/components/events/EventHeader'
import { MatchHistory } from '@/components/events/MatchHistory'
import { ExecuteMatchingButton } from '@/components/events/ExecuteMatchingButton'

export default async function EventPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  // ============================================================================
  // Authentication Check
  // ============================================================================
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const { eventId } = await params

  // ============================================================================
  // Create RLS-aware Supabase Client
  // ============================================================================
  const cookieStore = await cookies()
  const supabase = createServerClient(cookieStore)

  // ============================================================================
  // Fetch Event Details
  // ============================================================================
  const eventResult = await getEventDetails(supabase, eventId)

  if (eventResult.error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
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
                <h3 className="text-sm font-medium text-red-800">
                  Failed to load event
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{eventResult.error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!eventResult.data) {
    notFound()
  }

  const event = eventResult.data

  // ============================================================================
  // Fetch Order Book (Current Market Activity)
  // ============================================================================
  const orderBookResult = await getOrderBook(supabase, eventId)

  // ============================================================================
  // Fetch Transaction History (Executed Matches)
  // ============================================================================
  const matchesResult = await getEventMatches(supabase, eventId)

  // ============================================================================
  // Render Page
  // ============================================================================
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Event Header */}
        <EventHeader event={event} />

        {/* Current Market Activity (Order Book) */}
        {!orderBookResult.error && orderBookResult.data.length > 0 && (
          <div className="mb-8">
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Current Market Activity
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Asks (Sellers) */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Available Listings (Asks)
                  </h3>
                  <div className="space-y-2">
                    {orderBookResult.data
                      .filter((entry) => entry.book_side === 'ask')
                      .slice(0, 5)
                      .map((entry, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center py-2 px-3 rounded bg-red-50"
                        >
                          <span className="text-sm font-medium text-red-600">
                            ${(entry.price_cents / 100).toFixed(2)}
                          </span>
                          <span className="text-sm text-gray-600">
                            {entry.qty} {entry.qty === 1 ? 'ticket' : 'tickets'}
                          </span>
                        </div>
                      ))}
                    {orderBookResult.data.filter((entry) => entry.book_side === 'ask')
                      .length === 0 && (
                      <p className="text-sm text-gray-400 italic py-2">No active asks</p>
                    )}
                  </div>
                </div>

                {/* Bids (Buyers) */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Active Bids (Buyers)
                  </h3>
                  <div className="space-y-2">
                    {orderBookResult.data
                      .filter((entry) => entry.book_side === 'bid')
                      .slice(-5)
                      .reverse()
                      .map((entry, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center py-2 px-3 rounded bg-green-50"
                        >
                          <span className="text-sm font-medium text-green-600">
                            ${(entry.price_cents / 100).toFixed(2)}
                          </span>
                          <span className="text-sm text-gray-600">
                            {entry.qty} {entry.qty === 1 ? 'ticket' : 'tickets'}
                          </span>
                        </div>
                      ))}
                    {orderBookResult.data.filter((entry) => entry.book_side === 'bid')
                      .length === 0 && (
                      <p className="text-sm text-gray-400 italic py-2">No active bids</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={`/sell/create?eventId=${eventId}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Create Listing
                </a>
                <a
                  href={`/buy/${eventId}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Place Bid
                </a>
                <ExecuteMatchingButton eventId={eventId} />
              </div>
            </div>
          </div>
        )}

        {orderBookResult.data.length === 0 && (
          <div className="mb-8">
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Current Market Activity
              </h2>
              <div className="text-center py-8">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No active market</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Be the first to create a listing or place a bid.
                </p>
                <div className="mt-6 flex flex-wrap gap-3 justify-center">
                  <a
                    href={`/sell/create?eventId=${eventId}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Create Listing
                  </a>
                  <a
                    href={`/buy/${eventId}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Place Bid
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transaction History */}
        {matchesResult.error ? (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Could not load transaction history
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>{matchesResult.error}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <MatchHistory matches={matchesResult.data} />
        )}
      </div>
    </div>
  )
}

