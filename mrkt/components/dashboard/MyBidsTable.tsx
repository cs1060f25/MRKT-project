/**
 * My Bids Table Component
 *
 * Displays user's bids with event information and status.
 * Premium dark theme with glassmorphic styling.
 */

'use client'

import Link from 'next/link'
import type { Bid } from '@/lib/dashboard/types'
import { formatPrice, formatDateTime, formatStatus, getStatusColor } from '@/lib/utils/format'
import { EmptyState } from '@/components/common/EmptyState'

interface MyBidsTableProps {
  bids: Bid[]
}

export function MyBidsTable({ bids }: MyBidsTableProps) {
  if (bids.length === 0) {
    return (
      <EmptyState
        title="You haven't placed any bids"
        description="Browse events to place your first bid."
        action={{
          label: 'Browse Events',
          disabled: true,
        }}
      />
    )
  }

  return (
    <div className="glass rounded-2xl border border-white/10 overflow-hidden">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-white/10">
            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
              Event
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
              Price
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
              Quantity
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
              Created
            </th>
            <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-white/50 uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {bids.map((bid) => (
            <tr key={bid.id} className="hover:bg-white/5 transition-colors">
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-white">{bid.event.title}</div>
                <div className="text-sm text-white/50">{formatDateTime(bid.event.starts_at)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-[var(--color-gold)] font-medium">{formatPrice(bid.price_cents)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-white">{bid.qty}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusColor(bid.status)}`}>
                  {formatStatus(bid.status)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-white/50">{formatDateTime(bid.created_at)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                <Link
                  href={`/events/${bid.event_id}`}
                  className="text-[var(--color-gold)] hover:text-[var(--color-gold)]/80 font-medium transition-colors"
                >
                  View Event
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
