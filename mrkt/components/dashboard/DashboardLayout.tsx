/**
 * Dashboard Layout Component
 *
 * Tab-based layout for dashboard sections with premium dark theme.
 */

'use client'

import { useState } from 'react'
import type { Event, Bid, Ask, Ticket, BookEntry } from '@/lib/dashboard/types'
import { MarketTable } from './MarketTable'
import { MyBidsTable } from './MyBidsTable'
import { MyListingsTable } from './MyListingsTable'
import { MyTicketsTable } from './MyTicketsTable'
import { ErrorBanner } from '@/components/common/ErrorBanner'

interface DashboardLayoutProps {
  events: Event[]
  bids: Bid[]
  listings: Ask[]
  tickets: Ticket[]
  bookPreviews?: Map<string, BookEntry[]>
  errors?: {
    events?: string
    bids?: string
    listings?: string
    tickets?: string
  }
}

type Tab = 'market' | 'bids' | 'listings' | 'tickets'

export function DashboardLayout({
  events,
  bids,
  listings,
  tickets,
  bookPreviews,
  errors = {},
}: DashboardLayoutProps) {
  const [activeTab, setActiveTab] = useState<Tab>('market')

  const tabs = [
    { id: 'market' as const, name: 'Market', count: events.length },
    { id: 'bids' as const, name: 'My Bids', count: bids.length },
    { id: 'listings' as const, name: 'My Listings', count: listings.length },
    { id: 'tickets' as const, name: 'My Tickets', count: tickets.length },
  ]

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-white/10">
        <nav className="-mb-px flex space-x-1 sm:space-x-2" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative whitespace-nowrap py-4 px-4 sm:px-6 font-medium text-sm transition-all duration-200
                  ${
                    isActive
                      ? 'text-white'
                      : 'text-white/50 hover:text-white/80'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Active indicator */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-crimson)] rounded-t-full" />
                )}
                <span className="flex items-center gap-2">
                  {tab.name}
                  {tab.count > 0 && (
                    <span
                      className={`
                        py-0.5 px-2 rounded-full text-xs font-medium transition-colors
                        ${
                          isActive
                            ? 'bg-[var(--color-crimson)] text-white'
                            : 'bg-white/10 text-white/60'
                        }
                      `}
                    >
                      {tab.count}
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in-up">
        {activeTab === 'market' && (
          <>
            {errors.events ? (
              <ErrorBanner message={errors.events} />
            ) : (
              <MarketTable events={events} bookPreviews={bookPreviews} />
            )}
          </>
        )}

        {activeTab === 'bids' && (
          <>
            {errors.bids ? (
              <ErrorBanner message={errors.bids} />
            ) : (
              <MyBidsTable bids={bids} />
            )}
          </>
        )}

        {activeTab === 'listings' && (
          <>
            {errors.listings ? (
              <ErrorBanner message={errors.listings} />
            ) : (
              <MyListingsTable listings={listings} />
            )}
          </>
        )}

        {activeTab === 'tickets' && (
          <>
            {errors.tickets ? (
              <ErrorBanner message={errors.tickets} />
            ) : (
              <MyTicketsTable tickets={tickets} />
            )}
          </>
        )}
      </div>
    </div>
  )
}
