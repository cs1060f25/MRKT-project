/**
 * Market Table Component
 *
 * Displays upcoming events with optional order book preview.
 */

'use client'

import Link from 'next/link'
import type { Event, BookEntry } from '@/lib/dashboard/types'
import { formatDateTime, formatPrice } from '@/lib/utils/format'
import { EmptyState } from '@/components/common/EmptyState'

interface MarketTableProps {
  events: Event[]
  bookPreviews?: Map<string, BookEntry[]>
}

export function MarketTable({ events, bookPreviews }: MarketTableProps) {
  if (events.length === 0) {
    return (
      <EmptyState
        title="No upcoming events yet"
        description="Check back soon for new events."
      />
    )
  }

  const getBestPrices = (eventId: string) => {
    const book = bookPreviews?.get(eventId)
    if (!book || book.length === 0) return null

    const asks = book.filter((e) => e.book_side === 'ask')
    const bids = book.filter((e) => e.book_side === 'bid')

    const bestAsk = asks.length > 0 ? Math.min(...asks.map((a) => a.price_cents)) : null
    const bestBid = bids.length > 0 ? Math.max(...bids.map((b) => b.price_cents)) : null

    return { bestAsk, bestBid }
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
              Organization
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Start Time
            </th>
            {bookPreviews && (
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Book Preview
              </th>
            )}
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {events.map((event) => {
            const prices = getBestPrices(event.id)
            return (
              <tr key={event.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{event.title}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{event.org}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{formatDateTime(event.starts_at)}</div>
                </td>
                {bookPreviews && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    {prices ? (
                      <div className="text-sm text-gray-500">
                        {prices.bestAsk && <div>Ask: {formatPrice(prices.bestAsk)}</div>}
                        {prices.bestBid && <div>Bid: {formatPrice(prices.bestBid)}</div>}
                        {!prices.bestAsk && !prices.bestBid && <div className="text-gray-400">No orders</div>}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400">-</div>
                    )}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <Link
                    href={`/buy/${event.id}`}
                    className="text-indigo-600 hover:text-indigo-900 font-medium"
                  >
                    Place Bid
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
