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
import { QRUploader } from '@/components/sell/QRUploader'
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
  const [qrFile, setQrFile] = useState<File | null>(null)
  const [qrFileData, setQrFileData] = useState<{ blob: Blob; name: string; type: string } | null>(null)

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Handle file selection - read file into blob immediately to prevent stale references
  const handleFileSelect = async (file: File | null) => {
    setQrFile(file)

    if (file) {
      try {
        // Read file into blob to prevent ERR_UPLOAD_FILE_CHANGED errors
        const blob = new Blob([await file.arrayBuffer()], { type: file.type })
        setQrFileData({ blob, name: file.name, type: file.type })
      } catch (err) {
        console.error('Error reading file:', err)
        setQrFileData(null)
      }
    } else {
      setQrFileData(null)
    }
  }

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
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as string
        errors[field] = issue.message
      })
      setValidationErrors(errors)
      return
    }

    // Validate QR file is selected
    if (!qrFile) {
      setValidationErrors({ qrFile: 'QR code image is required' })
      return
    }

    // Submit to API
    setIsSubmitting(true)
    setUploadProgress(0)

    try {
      // Step 1: Create listing (ask) in database
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: eventId,
          price_cents: Math.round(priceNum * 100), // Convert dollars to cents
          qty: qtyNum,
        }),
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        setError(result.error || 'Failed to create listing')
        setIsSubmitting(false)
        return
      }

      // Step 2: Upload QR code via API endpoint
      if (!qrFileData) {
        setError('File data not available. Please select the file again.')
        setIsSubmitting(false)
        return
      }

      const formData = new FormData()
      // Create a new File from the blob to ensure it's valid
      const fileToUpload = new File([qrFileData.blob], qrFileData.name, { type: qrFileData.type })
      formData.append('file', fileToUpload)
      formData.append('eventId', eventId)

      setUploadProgress(50) // Show progress

      const uploadResponse = await fetch(`/api/listings/${result.askId}/upload-qr`, {
        method: 'POST',
        body: formData,
      })

      const uploadResult = await uploadResponse.json()

      if (!uploadResponse.ok || uploadResult.error) {
        setError(
          `Listing created, but QR upload failed: ${uploadResult.error || 'Unknown error'}. ` +
          'Please try uploading your QR code again from your listings page.'
        )
        setIsSubmitting(false)
        return
      }

      setUploadProgress(100)

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
        message="Your event listing and QR code have been uploaded successfully. Redirecting..."
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
          className="block text-sm font-medium text-white mb-2"
        >
          Event
        </label>
        <select
          id="event"
          name="event"
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className="block w-full rounded-lg bg-white/5 border border-white/20 px-4 py-3 text-white focus:ring-2 focus:ring-[var(--color-crimson)] focus:border-transparent sm:text-sm"
          disabled={isSubmitting}
        >
          <option value="" className="bg-[var(--color-charcoal)] text-white/50">Select an event...</option>
          {events.map((event) => {
            // Format date consistently to avoid hydration mismatch
            const dateStr = event.starts_at.split('T')[0] // Get YYYY-MM-DD
            return (
              <option key={event.id} value={event.id} className="bg-[var(--color-charcoal)] text-white">
                {event.title} - {event.org} ({dateStr})
              </option>
            )
          })}
        </select>
        {validationErrors.eventId && (
          <p className="mt-2 text-sm text-red-400">{validationErrors.eventId}</p>
        )}
      </div>

      {/* Price Input */}
      <div>
        <label
          htmlFor="price"
          className="block text-sm font-medium text-white mb-2"
        >
          Floor Price ($)
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
          Minimum price per ticket you're willing to accept
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
          Number of tickets you want to sell
        </p>
        {validationErrors.quantity && (
          <p className="mt-2 text-sm text-red-400">{validationErrors.quantity}</p>
        )}
      </div>

      {/* QR Code Upload */}
      <QRUploader
        file={qrFile}
        onFileSelect={handleFileSelect}
        disabled={isSubmitting}
        error={validationErrors.qrFile}
      />

      {/* Upload Progress */}
      {isSubmitting && uploadProgress > 0 && (
        <div className="rounded-xl border border-[var(--color-crimson)]/20 bg-[var(--color-crimson)]/10 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-[var(--color-crimson)] animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-white">
                Uploading QR code... {uploadProgress}%
              </p>
              <div className="mt-2 w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-[var(--color-crimson)] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full justify-center rounded-md bg-[var(--color-crimson)] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-crimson-dark)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-crimson)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? uploadProgress > 0
              ? 'Uploading QR Code...'
              : 'Creating Listing...'
            : 'Create Listing'}
        </button>
      </div>
    </form>
  )
}
