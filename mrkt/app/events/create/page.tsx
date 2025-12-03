/**
 * Events Page - Create Event
 *
 * Authenticated page for users to create new events.
 * Renders CreateEventForm for event creation.
 * Premium dark theme styling.
 */

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CreateEventForm } from '@/components/events/CreateEventForm'

export const metadata = {
  title: 'Create Event | MRKT',
  description: 'Create a new event for ticket trading',
}

export default async function CreateEventPage() {
  // ============================================================================
  // Authentication Check
  // ============================================================================
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // ============================================================================
  // Render Create Event Form
  // ============================================================================
  return (
    <div className="min-h-screen bg-[var(--color-charcoal)]">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-white/50 mb-4">
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <span className="text-white/30">›</span>
            <span className="text-white/70">Create Event</span>
          </div>
          <div className="elegant-divider mb-4" />
          <h1 className="font-[var(--font-playfair)] text-3xl font-bold text-white">Create Event</h1>
          <p className="mt-2 text-sm text-white/60">
            Create a new event for ticket trading on the marketplace
          </p>
        </div>

        {/* Form Container */}
        <div className="glass rounded-2xl border border-white/10 p-6">
          <CreateEventForm />
        </div>
      </div>
    </div>
  )
}
