/**
 * Dashboard Layout Component
 *
 * Tab-based layout for dashboard sections.
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
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    isActive
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                {tab.name}
                {tab.count > 0 && (
                  <span
                    className={`
                      ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium
                      ${
                        isActive
                          ? 'bg-indigo-100 text-indigo-600'
                          : 'bg-gray-100 text-gray-900'
                      }
                    `}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
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
