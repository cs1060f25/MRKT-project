/**
 * Empty State Component
 *
 * Friendly empty state with icon, message, and optional CTA button.
 * Premium dark theme styling.
 */

'use client'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick?: () => void
    disabled?: boolean
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-6">
        {icon || (
          <svg
            className="w-8 h-8 text-white/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        )}
      </div>
      <h3 className="text-base font-medium text-white mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-white/50 mb-6 max-w-sm mx-auto">{description}</p>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          disabled={action.disabled}
          className={`inline-flex items-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
            action.disabled
              ? 'bg-white/10 text-white/30 cursor-not-allowed'
              : 'bg-[var(--color-crimson)] text-white hover:bg-[var(--color-crimson-dark)] shadow-lg shadow-[var(--color-crimson)]/20'
          }`}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
