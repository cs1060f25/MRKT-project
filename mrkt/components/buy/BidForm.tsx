/**
 * Bid Form Component
 *
 * Form for placing a bid on an event.
 * Validates input, converts price to cents, and calls the create bid API.
 */

'use client'

import { useState } from 'react'
import { validateBidForm } from '@/lib/buy/validation'
import { useSupabase } from '@/providers/supabase-provider'
import { ErrorBanner } from '@/components/common/ErrorBanner'
import { SuccessMessage } from '@/components/common/SuccessMessage'

interface BidFormProps {
  eventId: string
  onSuccess?: () => void
}

export function BidForm({ eventId, onSuccess }: BidFormProps) {
  // Get authenticated Supabase client from provider
  const { supabase, isReady, supabaseUserId, refreshSession } = useSupabase()

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

    // Check if authentication is ready
    if (!isReady) {
      setError('Authentication is still initializing. Please wait a moment and try again.')
      return
    }

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
      const errors: Record<string, string> = {}

      const flatten = (validation.error as any)?.flatten?.()
      const fieldErrors: Record<string, string[] | undefined> | undefined = flatten?.fieldErrors
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, messages]) => {
          if (messages && messages.length > 0) {
            errors[field] = messages[0]
          }
        })
      }

      if (Object.keys(errors).length === 0) {
        const zodIssues =
          (Array.isArray((validation.error as any)?.errors)
            ? (validation.error as any).errors
            : Array.isArray((validation.error as any)?.issues)
              ? (validation.error as any).issues
              : []) as Array<{ path: (string | number)[]; message: string }>

        zodIssues.forEach((issue) => {
          const field = issue.path[0] as string
          if (!errors[field]) {
            errors[field] = issue.message
          }
        })
      }

      const aggregatedMessage = Object.values(errors).join(' ')
      if (aggregatedMessage) {
        setError(aggregatedMessage)
      }

      setValidationErrors(errors)
      setIsSubmitting(false)
      return
    }

    // Submit bid
    setIsSubmitting(true)

    try {
      // Validate we have a user ID
      if (!supabaseUserId) {
        setError('User not authenticated. Please sign in.')
        setIsSubmitting(false)
        return
      }

      // Convert price to cents
      const priceCents = Math.round(priceNum * 100)

      // Call API route to create bid
      const response = await fetch('/api/bids/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          priceCents,
          qty: qtyNum,
          buyerId: supabaseUserId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create bid')
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
            className="block text-sm font-medium text-white mb-2"
          >
            Max Price ($)
          </label>
          <div className="relative rounded-lg">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <span className="text-white/40 sm:text-sm">$</span>
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
              className="block w-full rounded-lg bg-white/5 border border-white/20 py-3 pl-8 pr-14 text-white placeholder:text-white/40 focus:ring-2 focus:ring-[var(--color-crimson)] focus:border-transparent sm:text-sm"
              disabled={isSubmitting}
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
              <span className="text-white/40 sm:text-sm">USD</span>
            </div>
          </div>
          <p className="mt-2 text-sm text-white/50">
            Maximum price per ticket you're willing to pay
          </p>
          {validationErrors.priceInDollars && (
            <p className="mt-2 text-sm text-red-400">{validationErrors.priceInDollars}</p>
          )}
        </div>

        {/* Quantity Input */}
        <div>
          <label
            htmlFor="quantity"
            className="block text-sm font-medium text-white mb-2"
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
            className="block w-full rounded-lg bg-white/5 border border-white/20 px-4 py-3 text-white placeholder:text-white/40 focus:ring-2 focus:ring-[var(--color-crimson)] focus:border-transparent sm:text-sm"
            disabled={isSubmitting}
          />
          <p className="mt-2 text-sm text-white/50">
            Number of tickets you want to buy
          </p>
          {validationErrors.quantity && (
            <p className="mt-2 text-sm text-red-400">{validationErrors.quantity}</p>
          )}
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={!isReady || isSubmitting}
            className="flex w-full justify-center rounded-md bg-[var(--color-crimson)] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-crimson-dark)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-crimson)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!isReady ? 'Initializing...' : isSubmitting ? 'Placing Bid...' : 'Place Bid'}
          </button>
          {!isReady && (
            <p className="mt-2 text-sm text-white/50 text-center">
              Setting up authentication...
            </p>
          )}
        </div>
      </form>
    </div>
  )
}
