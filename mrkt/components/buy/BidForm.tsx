/**
 * Bid Form Component
 *
 * Form for placing a bid on an event.
 * Validates input, converts price to cents, and calls rpc_create_bid.
 */

'use client'

import { useState } from 'react'
import { validateBidForm } from '@/lib/buy/validation'
import { createBid } from '@/lib/supabase/rpc'
import { createBrowserClient } from '@/lib/supabase/client'
import { ErrorBanner } from '@/components/common/ErrorBanner'
import { SuccessMessage } from '@/components/common/SuccessMessage'

interface BidFormProps {
  eventId: string
  onSuccess?: () => void
}

export function BidForm({ eventId, onSuccess }: BidFormProps) {
  // Form state
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
    setSuccess(false)

    // Parse input values
    const priceNum = parseFloat(priceInDollars)
    const qtyNum = parseInt(quantity, 10)

    // Validate form data
    const validation = validateBidForm({
      eventId,
      priceInDollars: priceNum,
      quantity: qtyNum,
    })

    if (!validation.success) {
      // Collect validation errors
      const errors: Record<string, string> = {}
      if (validation.error?.issues) {
        validation.error.issues.forEach((issue) => {
          const field = issue.path[0] as string
          errors[field] = issue.message
        })
      }
      setValidationErrors(errors)
      return
    }

    // Submit bid
    setIsSubmitting(true)

    try {
      const supabase = createBrowserClient()

      // Convert price to cents
      const priceCents = Math.round(priceNum * 100)

      // Call RPC function
      const result = await createBid(supabase, eventId, priceCents, qtyNum)

      if (result.error) {
        setError(result.error)
        setIsSubmitting(false)
        return
      }

      // Success!
      setSuccess(true)
      setIsSubmitting(false)

      // Clear form
      setPriceInDollars('')
      setQuantity('')

      // Notify parent component to refresh bid list
      if (onSuccess) {
        onSuccess()
      }

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false)
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {success && (
        <SuccessMessage
          title="Bid Placed!"
          message="Your bid has been successfully submitted."
        />
      )}

      {/* Error Banner */}
      {error && <ErrorBanner message={error} onRetry={() => setError(null)} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Price Input */}
        <div>
          <label
            htmlFor="price"
            className="block text-sm font-medium leading-6 text-gray-900"
          >
            Max Price ($)
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
            Maximum price per ticket you're willing to pay
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
            Number of tickets you want to buy
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
            {isSubmitting ? 'Placing Bid...' : 'Place Bid'}
          </button>
        </div>
      </form>
    </div>
  )
}
