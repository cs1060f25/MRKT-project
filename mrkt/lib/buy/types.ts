/**
 * Buy Flow Type Definitions
 *
 * TypeScript interfaces for bid creation and management.
 */

/**
 * Bid form input data (before conversion)
 */
export interface BidFormData {
  eventId: string
  priceInDollars: number
  quantity: number
}

/**
 * Parameters for RPC bid creation
 */
export interface CreateBidParams {
  event_id: string
  price_cents: number
  qty: number
}

/**
 * Result from RPC bid creation
 */
export interface CreateBidResult {
  bidId: string | null
  error: string | null
}

/**
 * Event option for selection dropdown
 */
export interface EventDetails {
  id: string
  title: string
  starts_at: string
  ends_at: string
  org: string
}

/**
 * User's bid with minimal event info
 */
export interface UserBid {
  id: string
  event_id: string
  buyer_id: string
  price_cents: number
  qty: number
  status: 'open' | 'matched' | 'cancelled'
  created_at: string
}
