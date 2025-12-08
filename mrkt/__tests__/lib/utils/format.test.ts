/**
 * Unit Tests: Formatting Utilities
 *
 * Tests for pure formatting functions in lib/utils/format.ts
 */

import {
  formatPrice,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatStatus,
  getStatusColor,
} from '@/lib/utils/format'

describe('formatPrice', () => {
  it('should format 5000 cents as "$50.00"', () => {
    expect(formatPrice(5000)).toBe('$50.00')
  })

  it('should format 0 cents as "$0.00"', () => {
    expect(formatPrice(0)).toBe('$0.00')
  })

  it('should format 99 cents as "$0.99"', () => {
    expect(formatPrice(99)).toBe('$0.99')
  })

  it('should format 100000 cents as "$1,000.00"', () => {
    expect(formatPrice(100000)).toBe('$1,000.00')
  })

  it('should format 5050 cents as "$50.50"', () => {
    expect(formatPrice(5050)).toBe('$50.50')
  })
})

describe('formatDate', () => {
  it('should format Date object to "Month Day, Year"', () => {
    const date = new Date('2025-11-06T00:00:00Z')
    expect(formatDate(date)).toBe('Nov 6, 2025')
  })

  it('should format ISO string to "Month Day, Year"', () => {
    expect(formatDate('2025-12-25T00:00:00Z')).toBe('Dec 25, 2025')
  })

  it('should use UTC timezone consistently', () => {
    // Test that late UTC time doesn't roll over to next day
    expect(formatDate('2025-01-01T23:59:59Z')).toBe('Jan 1, 2025')
  })
})

describe('formatDateTime', () => {
  it('should format date with time in AM format', () => {
    const date = new Date('2025-11-06T09:30:00Z')
    expect(formatDateTime(date)).toBe('Nov 6, 2025, 9:30 AM')
  })

  it('should format date with time in PM format', () => {
    const date = new Date('2025-11-06T15:30:00Z')
    expect(formatDateTime(date)).toBe('Nov 6, 2025, 3:30 PM')
  })

  it('should handle midnight correctly', () => {
    const date = new Date('2025-11-06T00:00:00Z')
    expect(formatDateTime(date)).toBe('Nov 6, 2025, 12:00 AM')
  })
})

describe('formatRelativeTime', () => {
  it('should return "just now" for times within a minute', () => {
    const now = new Date()
    expect(formatRelativeTime(now)).toBe('just now')
  })

  it('should format minutes ago correctly', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
    expect(formatRelativeTime(fiveMinAgo)).toBe('5 mins ago')
  })

  it('should format hours ago correctly', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
    expect(formatRelativeTime(twoHoursAgo)).toBe('2 hours ago')
  })

  it('should format days ago correctly', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    expect(formatRelativeTime(threeDaysAgo)).toBe('3 days ago')
  })

  it('should handle future dates with "from now"', () => {
    const inTwoHours = new Date(Date.now() + 2 * 60 * 60 * 1000)
    expect(formatRelativeTime(inTwoHours)).toBe('2 hours from now')
  })

  it('should use singular form for 1 unit', () => {
    const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000)
    expect(formatRelativeTime(oneHourAgo)).toBe('1 hour ago')
  })
})

describe('formatStatus', () => {
  it('should capitalize "open" to "Open"', () => {
    expect(formatStatus('open')).toBe('Open')
  })

  it('should capitalize "matched" to "Matched"', () => {
    expect(formatStatus('matched')).toBe('Matched')
  })

  it('should handle empty string', () => {
    expect(formatStatus('')).toBe('')
  })
})

describe('getStatusColor', () => {
  it('should return green classes for "open"', () => {
    expect(getStatusColor('open')).toBe('bg-green-500/20 text-green-400')
  })

  it('should return blue classes for "matched"', () => {
    expect(getStatusColor('matched')).toBe('bg-blue-500/20 text-blue-400')
  })

  it('should return neutral classes for "cancelled"', () => {
    expect(getStatusColor('cancelled')).toBe('bg-white/10 text-white/50')
  })

  it('should return default classes for unknown status', () => {
    expect(getStatusColor('unknown')).toBe('bg-white/10 text-white/50')
  })
})
