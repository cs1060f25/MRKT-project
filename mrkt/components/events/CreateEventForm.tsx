/**
 * Create Event Form Component
 *
 * Form for creating a new event.
 * Validates input and calls the event creation API.
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { validateEventForm, getFieldErrors } from '@/lib/events/validation'
import { ErrorBanner } from '@/components/common/ErrorBanner'
import { SuccessMessage } from '@/components/common/SuccessMessage'

export function CreateEventForm() {
  const router = useRouter()

  // Form state
  const [title, setTitle] = useState('')
  const [org, setOrg] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [createdEventId, setCreatedEventId] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Check if form is valid for submit button state
  const isFormValid = title.trim() && org.trim() && startsAt && endsAt

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setValidationErrors({})

    // Validate form data
    const validation = validateEventForm({
      title: title.trim(),
      org: org.trim(),
      startsAt,
      endsAt,
    })

    if (!validation.success) {
      const errors = getFieldErrors(validation)
      setValidationErrors(errors)
      return
    }

    // Submit to API
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/events/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          org: org.trim(),
          startsAt,
          endsAt,
        }),
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        // Handle validation errors from API
        if (result.details && Array.isArray(result.details)) {
          const errors: Record<string, string> = {}
          result.details.forEach((detail: { field: string; message: string }) => {
            errors[detail.field] = detail.message
          })
          setValidationErrors(errors)
        } else {
          setError(result.error || 'Failed to create event')
        }
        setIsSubmitting(false)
        return
      }

      // Success!
      setCreatedEventId(result.eventId)
      setSuccess(true)
      setIsSubmitting(false)

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <SuccessMessage
        title="Event Created!"
        message="Your event has been created successfully. Redirecting to dashboard..."
      />
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Banner */}
      {error && <ErrorBanner message={error} onRetry={() => setError(null)} />}

      {/* Event Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-white mb-2"
        >
          Event Title
        </label>
        <input
          type="text"
          name="title"
          id="title"
          placeholder="Fall Networking Mixer"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="block w-full rounded-lg bg-white/5 border border-white/20 px-4 py-3 text-white placeholder:text-white/40 focus:ring-2 focus:ring-[var(--color-crimson)] focus:border-transparent sm:text-sm"
          disabled={isSubmitting}
          maxLength={200}
        />
        <p className="mt-2 text-sm text-white/50">
          A descriptive name for your event
        </p>
        {validationErrors.title && (
          <p className="mt-2 text-sm text-red-400">{validationErrors.title}</p>
        )}
      </div>

      {/* Organization */}
      <div>
        <label
          htmlFor="org"
          className="block text-sm font-medium text-white mb-2"
        >
          Organization
        </label>
        <input
          type="text"
          name="org"
          id="org"
          placeholder="Tech Club"
          value={org}
          onChange={(e) => setOrg(e.target.value)}
          className="block w-full rounded-lg bg-white/5 border border-white/20 px-4 py-3 text-white placeholder:text-white/40 focus:ring-2 focus:ring-[var(--color-crimson)] focus:border-transparent sm:text-sm"
          disabled={isSubmitting}
          maxLength={100}
        />
        <p className="mt-2 text-sm text-white/50">
          The club or organization hosting this event
        </p>
        {validationErrors.org && (
          <p className="mt-2 text-sm text-red-400">{validationErrors.org}</p>
        )}
      </div>

      {/* Start Date/Time */}
      <div>
        <label
          htmlFor="startsAt"
          className="block text-sm font-medium text-white mb-2"
        >
          Start Date & Time
        </label>
        <input
          type="datetime-local"
          name="startsAt"
          id="startsAt"
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
          className="block w-full rounded-lg bg-white/5 border border-white/20 px-4 py-3 text-white focus:ring-2 focus:ring-[var(--color-crimson)] focus:border-transparent sm:text-sm [color-scheme:dark]"
          disabled={isSubmitting}
        />
        <p className="mt-2 text-sm text-white/50">
          When does the event start?
        </p>
        {validationErrors.startsAt && (
          <p className="mt-2 text-sm text-red-400">{validationErrors.startsAt}</p>
        )}
      </div>

      {/* End Date/Time */}
      <div>
        <label
          htmlFor="endsAt"
          className="block text-sm font-medium text-white mb-2"
        >
          End Date & Time
        </label>
        <input
          type="datetime-local"
          name="endsAt"
          id="endsAt"
          value={endsAt}
          onChange={(e) => setEndsAt(e.target.value)}
          className="block w-full rounded-lg bg-white/5 border border-white/20 px-4 py-3 text-white focus:ring-2 focus:ring-[var(--color-crimson)] focus:border-transparent sm:text-sm [color-scheme:dark]"
          disabled={isSubmitting}
        />
        <p className="mt-2 text-sm text-white/50">
          When does the event end?
        </p>
        {validationErrors.endsAt && (
          <p className="mt-2 text-sm text-red-400">{validationErrors.endsAt}</p>
        )}
      </div>

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          disabled={isSubmitting || !isFormValid}
          className="flex w-full justify-center rounded-md bg-[var(--color-crimson)] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-crimson-dark)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-crimson)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creating Event...' : 'Create Event'}
        </button>
      </div>

      {/* Cancel Link */}
      <div className="text-center">
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="text-sm text-white/60 hover:text-white transition-colors"
          disabled={isSubmitting}
        >
          Cancel and return to dashboard
        </button>
      </div>
    </form>
  )
}
