/**
 * Buy Page - Place Bid on Event
 *
 * Authenticated page for buyers to place bids on events.
 * Displays event details, order book preview, existing bids, and bid form.
 */

import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@/lib/supabase/server'
import { getEventDetails, getEventBids } from '@/lib/buy/queries'
import { getOrderBook } from '@/lib/supabase/rpc'
import { BidForm } from '@/components/buy/BidForm'
import { BidList } from '@/components/buy/BidList'

export default async function BuyEventPage({
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
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
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
  // Fetch User's Bids for This Event
  // ============================================================================
  const bidsResult = await getEventBids(supabase, eventId, userId)

  // ============================================================================
  // Fetch Order Book (optional - for context)
  // ============================================================================
  const orderBookResult = await getOrderBook(supabase, eventId)

  // ============================================================================
  // Render Page
  // ============================================================================
  const eventDate = new Date(event.starts_at).toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header - Event Details */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <a href="/" className="hover:text-gray-700">Home</a>
            <span>›</span>
            <span>Place Bid</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
          <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <span>{event.org}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>{eventDate}</span>
            </div>
          </div>
        </div>

        {/* Order Book Preview */}
        {!orderBookResult.error && orderBookResult.data.length > 0 && (
          <div className="mb-8">
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Market Overview
              </h2>
              <div className="grid grid-cols-2 gap-6">
                {/* Asks (Sellers) */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Available Listings (Asks)
                  </h3>
                  <div className="space-y-1">
                    {orderBookResult.data
                      .filter((entry) => entry.book_side === 'ask')
                      .slice(0, 3)
                      .map((entry, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between text-sm py-1"
                        >
                          <span className="text-red-600 font-medium">
                            ${(entry.price_cents / 100).toFixed(2)}
                          </span>
                          <span className="text-gray-500">{entry.qty} tickets</span>
                        </div>
                      ))}
                    {orderBookResult.data.filter((entry) => entry.book_side === 'ask')
                      .length === 0 && (
                      <p className="text-sm text-gray-400 italic">No asks</p>
                    )}
                  </div>
                </div>

                {/* Bids (Buyers) */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Active Bids (Buyers)
                  </h3>
                  <div className="space-y-1">
                    {orderBookResult.data
                      .filter((entry) => entry.book_side === 'bid')
                      .slice(-3)
                      .reverse()
                      .map((entry, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between text-sm py-1"
                        >
                          <span className="text-green-600 font-medium">
                            ${(entry.price_cents / 100).toFixed(2)}
                          </span>
                          <span className="text-gray-500">{entry.qty} tickets</span>
                        </div>
                      ))}
                    {orderBookResult.data.filter((entry) => entry.book_side === 'bid')
                      .length === 0 && (
                      <p className="text-sm text-gray-400 italic">No bids</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User's Existing Bids */}
        {bidsResult.error && (
          <div className="mb-8 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
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
                  Could not load your bids
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>{bidsResult.error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!bidsResult.error && (
          <div className="mb-8">
            <BidList bids={bidsResult.data} />
          </div>
        )}

        {/* Bid Form */}
        <div className="rounded-lg bg-white shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Place a Bid</h2>
            <p className="mt-1 text-sm text-gray-500">
              Enter the maximum price you're willing to pay and the quantity you want
            </p>
          </div>
          <BidForm eventId={eventId} />
        </div>
      </div>
    </div>
  )
}
