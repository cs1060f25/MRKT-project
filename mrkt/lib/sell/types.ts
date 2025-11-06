/**
 * Type Definitions for Sell Flow
 *
 * TypeScript interfaces for creating and managing event listings.
 */

/**
 * Form data for creating a new listing
 */
export interface CreateListingFormData {
  eventId: string
  priceInDollars: number
  quantity: number
}

/**
 * RPC parameters for rpc_create_ask
 */
export interface CreateAskParams {
  event_id: string
  price_cents: number
  qty: number
  qr_storage_path: string
}

/**
 * Result of creating an ask
 */
export interface CreateAskResult {
  askId: string | null
  error: string | null
}

/**
 * Event option for dropdown
 */
export interface EventOption {
  id: string
  title: string
  starts_at: string
  org: string
}
