/**
 * Formatting Utilities
 *
 * Helper functions for formatting prices, dates, and status values.
 */

/**
 * Format price in cents to dollar string
 * @param cents - Price in cents
 * @returns Formatted price string (e.g., "$50.00")
 */
export function formatPrice(cents: number): string {
  const dollars = cents / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(dollars)
}

/**
 * Format date to short format
 * Uses UTC timezone to prevent hydration mismatches between server and client
 * @param date - Date string or Date object
 * @returns Formatted date string (e.g., "Nov 6, 2025")
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d)
}

/**
 * Format date and time
 * Uses UTC timezone to prevent hydration mismatches between server and client
 * @param date - Date string or Date object
 * @returns Formatted date-time string (e.g., "Nov 6, 2025, 3:30 PM")
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  }).format(d)
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 * @param date - Date string or Date object
 * @returns Relative time string
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (Math.abs(diffMin) < 1) return 'just now'
  if (Math.abs(diffMin) < 60) return `${Math.abs(diffMin)} min${Math.abs(diffMin) !== 1 ? 's' : ''} ${diffMin < 0 ? 'ago' : 'from now'}`
  if (Math.abs(diffHour) < 24) return `${Math.abs(diffHour)} hour${Math.abs(diffHour) !== 1 ? 's' : ''} ${diffHour < 0 ? 'ago' : 'from now'}`
  return `${Math.abs(diffDay)} day${Math.abs(diffDay) !== 1 ? 's' : ''} ${diffDay < 0 ? 'ago' : 'from now'}`
}

/**
 * Format status to display string
 * @param status - Status string
 * @returns Capitalized status
 */
export function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

/**
 * Get status badge color classes (dark theme)
 * @param status - Status string
 * @returns Tailwind CSS classes for badge
 */
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'open':
      return 'bg-green-500/20 text-green-400'
    case 'matched':
      return 'bg-blue-500/20 text-blue-400'
    case 'cancelled':
      return 'bg-white/10 text-white/50'
    default:
      return 'bg-white/10 text-white/50'
  }
}
