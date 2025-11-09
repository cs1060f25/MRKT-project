/**
 * My Bids Table Component
 *
 * Displays user's bids with event information and status.
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
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Event
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Price
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Quantity
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {bids.map((bid) => (
            <tr key={bid.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-gray-900">{bid.event.title}</div>
                <div className="text-sm text-gray-500">{formatDateTime(bid.event.starts_at)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{formatPrice(bid.price_cents)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{bid.qty}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(bid.status)}`}>
                  {formatStatus(bid.status)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{formatDateTime(bid.created_at)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                <Link
                  href={`/events/${bid.event_id}`}
                  className="text-indigo-600 hover:text-indigo-900 font-medium"
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
