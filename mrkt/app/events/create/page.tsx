/**
 * Events Page - Create Event
 *
 * Authenticated page for users to create new events.
 * Renders CreateEventForm for event creation.
 */

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
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
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Event</h1>
          <p className="mt-2 text-sm text-gray-600">
            Create a new event for ticket trading on the marketplace
          </p>
        </div>

        {/* Form Container */}
        <div className="rounded-lg bg-white shadow-sm border border-gray-200 p-6">
          <CreateEventForm />
        </div>
      </div>
    </div>
  )
}
