/**
 * Bid List Component
 *
 * Displays a list of user's bids for an event.
 * Shows price, quantity, status, and creation time.
 */

'use client'

import type { UserBid } from '@/lib/buy/types'

interface BidListProps {
  bids: UserBid[]
}

export function BidList({ bids }: BidListProps) {
  if (bids.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8">
        <div className="text-center">
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No bids yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Place your first bid using the form below
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div className="px-4 py-5 sm:px-6 bg-gray-50">
        <h3 className="text-lg font-medium text-gray-900">Your Bids</h3>
        <p className="mt-1 text-sm text-gray-500">
          {bids.length} {bids.length === 1 ? 'bid' : 'bids'} for this event
        </p>
      </div>

      <ul className="divide-y divide-gray-200">
        {bids.map((bid) => {
          const priceInDollars = (bid.price_cents / 100).toFixed(2)
          const createdDate = new Date(bid.created_at).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })

          // Status badge color
          const statusColors = {
            open: 'bg-blue-100 text-blue-800',
            matched: 'bg-green-100 text-green-800',
            cancelled: 'bg-gray-100 text-gray-800',
          }

          return (
            <li key={bid.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-semibold text-gray-900">
                      ${priceInDollars}
                    </p>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        statusColors[bid.status]
                      }`}
                    >
                      {bid.status}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                    <span>Quantity: {bid.qty}</span>
                    <span>•</span>
                    <span>{createdDate}</span>
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
