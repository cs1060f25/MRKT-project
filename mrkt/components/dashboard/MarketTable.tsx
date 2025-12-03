/**
 * Market Table Component
 *
 * Displays upcoming events with optional order book preview.
 * Premium dark theme with glassmorphic styling.
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
      <div className="space-y-6">
        {/* Create Event Button */}
        <div className="flex justify-end">
          <Link
            href="/events/create"
            className="btn-primary inline-flex items-center rounded-lg bg-[var(--color-crimson)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--color-crimson)]/20 hover:bg-[var(--color-crimson-dark)] transition-all"
          >
            <svg
              className="-ml-0.5 mr-2 h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            Create Event
          </Link>
        </div>
        <EmptyState
          title="No upcoming events yet"
          description="Create an event to get started or check back soon."
        />
      </div>
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
    <div className="space-y-4">
      {/* Create Event Button */}
      <div className="flex justify-end">
        <Link
          href="/events/create"
          className="btn-primary inline-flex items-center rounded-lg bg-[var(--color-crimson)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--color-crimson)]/20 hover:bg-[var(--color-crimson-dark)] transition-all"
        >
          <svg
            className="-ml-0.5 mr-2 h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          Create Event
        </Link>
      </div>

      {/* Events Table */}
      <div className="glass rounded-2xl border border-white/10 overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                Event
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                Organization
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                Start Time
              </th>
              {bookPreviews && (
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                  Book Preview
                </th>
              )}
              <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-white/50 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {events.map((event) => {
              const prices = getBestPrices(event.id)
              return (
                <tr key={event.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{event.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white/60">{event.org}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white/60">{formatDateTime(event.starts_at)}</div>
                  </td>
                  {bookPreviews && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      {prices ? (
                        <div className="text-sm space-y-0.5">
                          {prices.bestAsk && (
                            <div className="text-white/60">
                              Ask: <span className="text-[var(--color-gold)] font-medium">{formatPrice(prices.bestAsk)}</span>
                            </div>
                          )}
                          {prices.bestBid && (
                            <div className="text-white/60">
                              Bid: <span className="text-[var(--color-gold)] font-medium">{formatPrice(prices.bestBid)}</span>
                            </div>
                          )}
                          {!prices.bestAsk && !prices.bestBid && (
                            <div className="text-white/40">No orders</div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-white/40">-</div>
                      )}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-3">
                    <Link
                      href={`/events/${event.id}`}
                      className="text-[var(--color-gold)] hover:text-[var(--color-gold)]/80 font-medium transition-colors"
                    >
                      View Event
                    </Link>
                    <Link
                      href={`/sell/create?eventId=${event.id}`}
                      className="text-[var(--color-gold)] hover:text-[var(--color-gold)]/80 font-medium transition-colors"
                    >
                      Create Listing
                    </Link>
                    <Link
                      href={`/buy/${event.id}`}
                      className="text-[var(--color-gold)] hover:text-[var(--color-gold)]/80 font-medium transition-colors"
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
    </div>
  )
}
