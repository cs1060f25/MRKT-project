/**
 * My Tickets Table Component
 *
 * Displays user's tickets (as winner) with event information and delivery status.
 */

'use client'

import type { Ticket } from '@/lib/dashboard/types'
import { formatDateTime, formatPrice } from '@/lib/utils/format'
import { EmptyState } from '@/components/common/EmptyState'

interface MyTicketsTableProps {
  tickets: Ticket[]
}

export function MyTicketsTable({ tickets }: MyTicketsTableProps) {
  if (tickets.length === 0) {
    return (
      <EmptyState
        title="No tickets yet"
        description="Win a bid to receive your first ticket."
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
              Match Price
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Match Date
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Delivered
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {tickets.map((ticket) => (
            <tr key={ticket.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-gray-900">{ticket.event.title}</div>
                <div className="text-sm text-gray-500">{formatDateTime(ticket.event.starts_at)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {formatPrice(ticket.match.clearing_price_cents)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{formatDateTime(ticket.match.created_at)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {ticket.delivered_at ? (
                  <span className="inline-flex items-center text-green-600 text-sm">
                    <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {formatDateTime(ticket.delivered_at)}
                  </span>
                ) : (
                  <span className="inline-flex items-center text-yellow-600 text-sm">
                    <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    Pending
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                <button
                  type="button"
                  disabled
                  title="Storage integration pending"
                  className="text-gray-400 cursor-not-allowed font-medium"
                >
                  View Ticket
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
