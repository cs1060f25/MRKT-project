/**
 * EventHeader Component
 *
 * Displays event metadata including title, organization, and dates.
 * Premium dark theme styling.
 */

import Link from 'next/link'
import type { EventDetails } from '@/lib/events/types'

interface EventHeaderProps {
  event: EventDetails
}

export function EventHeader({ event }: EventHeaderProps) {
  const startDate = new Date(event.starts_at).toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  const endDate = new Date(event.ends_at).toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 text-sm text-white/50 mb-4">
        <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
        <span className="text-white/30">›</span>
        <span className="text-white/70">Event Details</span>
      </div>

      <div className="elegant-divider mb-4" />
      <h1 className="font-[var(--font-playfair)] text-3xl font-bold text-white">{event.title}</h1>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-4 text-sm">
        <div className="flex items-center gap-2 text-white/60">
          <svg
            className="h-5 w-5 text-white/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <span className="font-medium text-white">{event.org}</span>
        </div>

        <div className="flex items-center gap-2 text-white/60">
          <svg
            className="h-5 w-5 text-white/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <div>
            <span>{startDate}</span>
            <span className="text-white/30"> - </span>
            <span>{endDate}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
