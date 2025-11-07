/**
 * Create Listing Form Component
 *
 * Form for creating a new event listing (ask).
 * Validates input, converts price to cents, and calls rpc_create_ask.
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { validateListingForm } from '@/lib/sell/validation'
import { ErrorBanner } from '@/components/common/ErrorBanner'
import { SuccessMessage } from '@/components/common/SuccessMessage'
import type { EventOption } from '@/lib/sell/types'

interface CreateListingFormProps {
  events: EventOption[]
}

export function CreateListingForm({ events }: CreateListingFormProps) {
  const router = useRouter()

  // Form state
  const [eventId, setEventId] = useState('')
  const [priceInDollars, setPriceInDollars] = useState('')
  const [quantity, setQuantity] = useState('')

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setValidationErrors({})

    // Parse input values
    const priceNum = parseFloat(priceInDollars)
    const qtyNum = parseInt(quantity, 10)

    // Validate form data
    const validation = validateListingForm({
      eventId,
      priceInDollars: priceNum,
      quantity: qtyNum,
    })

    if (!validation.success) {
      // Collect validation errors
      const errors: Record<string, string> = {}
      if (validation.error?.errors) {
        validation.error.errors.forEach((err) => {
          const field = err.path[0] as string
          errors[field] = err.message
        })
      }
      setValidationErrors(errors)
      return
    }

    // Submit to API
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: eventId,
          price_cents: Math.round(priceNum * 100), // Convert dollars to cents
          qty: qtyNum,
          qr_storage_path: `pending-upload/${crypto.randomUUID()}`, // Stub for now
        }),
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        setError(result.error || 'Failed to create listing')
        setIsSubmitting(false)
        return
      }

      // Success!
      setSuccess(true)
      setIsSubmitting(false)

      // Redirect to success page after 2 seconds
      setTimeout(() => {
        router.push('/sell/success')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <SuccessMessage
        title="Listing Created!"
        message="Your event listing has been created successfully. Redirecting..."
      />
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Banner */}
      {error && <ErrorBanner message={error} onRetry={() => setError(null)} />}

      {/* Event Selection */}
      <div>
        <label
          htmlFor="event"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Event
        </label>
        <select
          id="event"
          name="event"
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-[var(--color-crimson)] sm:text-sm sm:leading-6"
          disabled={isSubmitting}
        >
          <option value="">Select an event...</option>
          {events.map((event) => {
            // Format date consistently to avoid hydration mismatch
            const dateStr = event.starts_at.split('T')[0] // Get YYYY-MM-DD
            return (
              <option key={event.id} value={event.id}>
                {event.title} - {event.org} ({dateStr})
              </option>
            )
          })}
        </select>
        {validationErrors.eventId && (
          <p className="mt-2 text-sm text-red-600">{validationErrors.eventId}</p>
        )}
      </div>

      {/* Price Input */}
      <div>
        <label
          htmlFor="price"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Floor Price ($)
        </label>
        <div className="relative mt-2 rounded-md shadow-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            type="number"
            name="price"
            id="price"
            step="0.01"
            min="0"
            max="10000"
            placeholder="0.00"
            value={priceInDollars}
            onChange={(e) => setPriceInDollars(e.target.value)}
            className="block w-full rounded-md border-0 py-1.5 pl-7 pr-12 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[var(--color-crimson)] sm:text-sm sm:leading-6"
            disabled={isSubmitting}
          />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-gray-500 sm:text-sm">USD</span>
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Minimum price per ticket you're willing to accept
        </p>
        {validationErrors.priceInDollars && (
          <p className="mt-2 text-sm text-red-600">{validationErrors.priceInDollars}</p>
        )}
      </div>

      {/* Quantity Input */}
      <div>
        <label
          htmlFor="quantity"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Quantity
        </label>
        <input
          type="number"
          name="quantity"
          id="quantity"
          min="1"
          max="100"
          placeholder="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[var(--color-crimson)] sm:text-sm sm:leading-6"
          disabled={isSubmitting}
        />
        <p className="mt-2 text-sm text-gray-500">
          Number of tickets you want to sell
        </p>
        {validationErrors.quantity && (
          <p className="mt-2 text-sm text-red-600">{validationErrors.quantity}</p>
        )}
      </div>

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full justify-center rounded-md bg-[var(--color-crimson)] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-crimson-dark)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-crimson)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creating Listing...' : 'Create Listing'}
        </button>
      </div>
    </form>
  )
}
