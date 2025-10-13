/**
 * Format currency values
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

/**
 * Format date/time
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

/**
 * Format date only
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
  }).format(d);
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Check if event is currently accepting listings
 */
export function isListingWindowOpen(listingOpenTime: Date, listingCloseTime: Date): boolean {
  const now = new Date();
  return now >= listingOpenTime && now <= listingCloseTime;
}

/**
 * Check if event has passed
 */
export function isEventPast(eventDateTime: Date): boolean {
  return new Date(eventDateTime) < new Date();
}

/**
 * Format listing window status
 */
export function getListingWindowStatus(
  listingOpenTime: Date,
  listingCloseTime: Date
): 'upcoming' | 'open' | 'closed' {
  const now = new Date();

  if (now < listingOpenTime) {
    return 'upcoming';
  } else if (now > listingCloseTime) {
    return 'closed';
  } else {
    return 'open';
  }
}

/**
 * Calculate liquidity score (0-1)
 */
export function calculateLiquidityScore(listingCount: number, targetCount: number = 20): number {
  if (targetCount === 0) return 0;
  return Math.min(listingCount / targetCount, 1);
}

/**
 * Get liquidity level label
 */
export function getLiquidityLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 0.5) return 'high';
  if (score >= 0.2) return 'medium';
  return 'low';
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}
