/**
 * Bid List Component
 *
 * Displays a list of user's bids for an event.
 * Shows price, quantity, status, and creation time.
 * Premium dark theme styling.
 */

'use client'

import type { UserBid } from '@/lib/buy/types'

interface BidListProps {
  bids: UserBid[]
}

export function BidList({ bids }: BidListProps) {
  if (bids.length === 0) {
    return (
      <div className="glass rounded-2xl border border-white/10 p-8">
        <div className="text-center">
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-2 text-sm font-semibold text-white">No bids yet</h3>
          <p className="mt-1 text-sm text-white/50">
            Place your first bid using the form below
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl border border-white/10 overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-white/10">
        <h3 className="text-lg font-medium text-white">Your Bids</h3>
        <p className="mt-1 text-sm text-white/50">
          {bids.length} {bids.length === 1 ? 'bid' : 'bids'} for this event
        </p>
      </div>

      <ul className="divide-y divide-white/10">
        {bids.map((bid) => {
          const priceInDollars = (bid.price_cents / 100).toFixed(2)
          const createdDate = new Date(bid.created_at).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })

          // Status badge colors for dark theme
          const statusColors = {
            open: 'bg-green-500/20 text-green-400',
            matched: 'bg-blue-500/20 text-blue-400',
            cancelled: 'bg-white/10 text-white/50',
          }

          return (
            <li key={bid.id} className="px-4 py-4 sm:px-6 hover:bg-white/5 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-semibold text-white">
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
                  <div className="mt-1 flex items-center gap-4 text-sm text-white/50">
                    <span>Quantity: {bid.qty}</span>
                    <span className="text-white/30">•</span>
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
