/**
 * MatchHistory Component
 *
 * Displays executed transactions (matches) for an event.
 * Shows anonymous transaction history with price, quantity, and timestamp.
 * Premium dark theme styling.
 */

import type { EventMatch } from '@/lib/events/types'

interface MatchHistoryProps {
  matches: EventMatch[]
}

export function MatchHistory({ matches }: MatchHistoryProps) {
  if (matches.length === 0) {
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-white">No transactions yet</h3>
          <p className="mt-1 text-sm text-white/50">
            Be the first to place a bid or listing for this event.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl border border-white/10 overflow-hidden">
      <div className="px-6 py-4 border-b border-white/10">
        <h2 className="text-lg font-semibold text-white">Transaction History</h2>
        <p className="mt-1 text-sm text-white/50">
          Recent executed trades for this event ({matches.length} total)
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10">
          <thead>
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider"
              >
                Time
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider"
              >
                Price
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider"
              >
                Quantity
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {matches.map((match) => {
              const matchDate = new Date(match.created_at)
              const timeString = matchDate.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })

              return (
                <tr key={match.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {timeString}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-400">
                    ${(match.clearing_price_cents / 100).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                    {match.qty} {match.qty === 1 ? 'ticket' : 'tickets'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
