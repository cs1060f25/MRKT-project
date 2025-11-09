/**
 * Dashboard Type Definitions
 *
 * TypeScript interfaces for dashboard data structures.
 */

/**
 * Event from events table
 */
export interface Event {
  id: string
  title: string
  starts_at: string
  ends_at: string
  org: string
  created_by: string
  created_at: string
}

/**
 * Bid with event information (joined query)
 */
export interface Bid {
  id: string
  event_id: string
  buyer_id: string
  price_cents: number
  qty: number
  status: 'open' | 'matched' | 'cancelled'
  created_at: string
  event: {
    title: string
    starts_at: string
  }
}

/**
 * Ask/Listing with event information (joined query)
 */
export interface Ask {
  id: string
  event_id: string
  seller_id: string
  price_cents: number
  qty: number
  qr_storage_path: string | null
  status: 'open' | 'matched' | 'cancelled'
  created_at: string
  event: {
    title: string
    starts_at: string
  }
}

/**
 * Ticket with match and event information (joined query)
 */
export interface Ticket {
  id: string
  match_id: string
  winner_id: string
  qr_storage_path: string
  delivered_at: string | null
  created_at: string
  match: {
    event_id: string
    clearing_price_cents: number
    created_at: string
  }
  event: {
    title: string
    starts_at: string
  }
}

/**
 * Order book entry from rpc_get_book
 */
export interface BookEntry {
  book_side: 'ask' | 'bid'
  price_cents: number
  qty: number
}

/**
 * Query result wrapper with error handling
 */
export interface QueryResult<T> {
  data: T
  error: string | null
}
