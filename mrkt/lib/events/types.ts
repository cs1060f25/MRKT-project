/**
 * Event Page Type Definitions
 *
 * Types used for the event detail page, including event info,
 * market data (order book), and executed matches (transaction history).
 */

/**
 * Event details displayed on event page
 */
export interface EventDetails {
  id: string
  title: string
  starts_at: string
  ends_at: string
  org: string
  created_by?: string
  created_at?: string
}

/**
 * Executed match (transaction history)
 * Anonymous - no buyer/seller information displayed
 */
export interface EventMatch {
  id: string
  clearing_price_cents: number
  qty: number
  created_at: string
}

/**
 * Generic query result wrapper
 */
export interface QueryResult<T> {
  data: T
  error: string | null
}

