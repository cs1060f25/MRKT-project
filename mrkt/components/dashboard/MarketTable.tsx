/**
 * Market Table Component
 *
 * Displays upcoming events with optional order book preview.
 * Includes search and filter functionality.
 * Premium dark theme with glassmorphic styling.
 */

'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { Event, BookEntry } from '@/lib/dashboard/types'
import { formatDateTime, formatPrice } from '@/lib/utils/format'
import { EmptyState } from '@/components/common/EmptyState'

interface MarketTableProps {
  events: Event[]
  bookPreviews?: Map<string, BookEntry[]>
}

export function MarketTable({ events, bookPreviews }: MarketTableProps) {
  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [orgFilter, setOrgFilter] = useState('')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')

  // Get unique organizations for dropdown
  const uniqueOrgs = useMemo(() => {
    const orgs = [...new Set(events.map(e => e.org))]
    return orgs.sort((a, b) => a.localeCompare(b))
  }, [events])

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Search by title
      const matchesSearch = searchQuery === '' ||
        event.title.toLowerCase().includes(searchQuery.toLowerCase())

      // Filter by organization
      const matchesOrg = orgFilter === '' || event.org === orgFilter

      // Filter by date range
      const eventDate = new Date(event.starts_at)
      const now = new Date()
      let matchesDate = true
      if (dateFilter === 'today') {
        matchesDate = eventDate.toDateString() === now.toDateString()
      } else if (dateFilter === 'week') {
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        matchesDate = eventDate >= now && eventDate <= weekFromNow
      } else if (dateFilter === 'month') {
        const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        matchesDate = eventDate >= now && eventDate <= monthFromNow
      }

      return matchesSearch && matchesOrg && matchesDate
    })
  }, [events, searchQuery, orgFilter, dateFilter])

  // Check if any filters are active
  const hasActiveFilters = searchQuery !== '' || orgFilter !== '' || dateFilter !== 'all'

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('')
    setOrgFilter('')
    setDateFilter('all')
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

  // Empty state when no events exist at all
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

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-xs">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg
              className="h-5 w-5 text-white/40"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search events"
            className="w-full rounded-lg bg-white/5 border border-white/20 py-2 pl-10 pr-4 text-white placeholder:text-white/40 focus:ring-2 focus:ring-[var(--color-crimson)] focus:border-transparent text-sm transition-colors"
          />
        </div>

        {/* Organization Filter */}
        <select
          value={orgFilter}
          onChange={(e) => setOrgFilter(e.target.value)}
          aria-label="Filter by organization"
          className="rounded-lg bg-white/5 border border-white/20 px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[var(--color-crimson)] focus:border-transparent transition-colors"
        >
          <option value="" className="bg-[var(--color-charcoal)]">All Organizations</option>
          {uniqueOrgs.map(org => (
            <option key={org} value={org} className="bg-[var(--color-charcoal)]">
              {org}
            </option>
          ))}
        </select>

        {/* Date Range Filter */}
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value as 'all' | 'today' | 'week' | 'month')}
          aria-label="Filter by date range"
          className="rounded-lg bg-white/5 border border-white/20 px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[var(--color-crimson)] focus:border-transparent transition-colors"
        >
          <option value="all" className="bg-[var(--color-charcoal)]">All Dates</option>
          <option value="today" className="bg-[var(--color-charcoal)]">Today</option>
          <option value="week" className="bg-[var(--color-charcoal)]">This Week</option>
          <option value="month" className="bg-[var(--color-charcoal)]">This Month</option>
        </select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-[var(--color-crimson)] hover:text-[var(--color-crimson-dark)] font-medium transition-colors whitespace-nowrap"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Results Count */}
      {hasActiveFilters && (
        <p className="text-sm text-white/50">
          Showing {filteredEvents.length} of {events.length} events
        </p>
      )}

      {/* Empty state when filters return no results */}
      {filteredEvents.length === 0 && hasActiveFilters && (
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
                strokeWidth={1.5}
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-white">No matching events</h3>
            <p className="mt-1 text-sm text-white/50">
              Try adjusting your search or filters
            </p>
            <button
              onClick={clearFilters}
              className="mt-4 text-sm text-[var(--color-crimson)] hover:text-[var(--color-crimson-dark)] font-medium transition-colors"
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}

      {/* Events Table */}
      {filteredEvents.length > 0 && (
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
              {filteredEvents.map((event) => {
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
      )}
    </div>
  )
}
