/**
 * Success Message Component
 *
 * Displays success messages with optional action button.
 */

'use client'

interface SuccessMessageProps {
  title?: string
  message: string
  actionLabel?: string
  onAction?: () => void
}

export function SuccessMessage({
  title = 'Success',
  message,
  actionLabel,
  onAction,
}: SuccessMessageProps) {
  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-green-400"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-green-800">{title}</h3>
          <div className="mt-2 text-sm text-green-700">
            <p>{message}</p>
          </div>
          {actionLabel && onAction && (
            <div className="mt-4">
              <button
                type="button"
                onClick={onAction}
                className="rounded-md bg-green-50 px-3 py-2 text-sm font-semibold text-green-800 shadow-sm hover:bg-green-100"
              >
                {actionLabel}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
