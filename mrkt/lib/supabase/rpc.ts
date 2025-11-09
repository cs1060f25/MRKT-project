/**
 * Supabase RPC Helper Functions
 *
 * Typed wrappers for Supabase RPC functions.
 * Uses RLS-aware client - auth handled via Supabase JWT.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { CreateAskParams, CreateAskResult } from '../sell/types'

/**
 * Create a new ask (listing) via RPC
 *
 * Calls rpc_create_ask which:
 * - Validates inputs (price_cents > 0, qty > 0, etc.)
 * - Sets seller_id to auth.uid() automatically
 * - Inserts into asks table with status='open'
 * - Returns the new ask ID
 *
 * @param supabase - RLS-aware Supabase client
 * @param params - Ask parameters
 * @returns Ask ID if successful, error message if failed
 *
 * @example
 * ```typescript
 * const result = await createAsk(supabase, {
 *   event_id: '123e4567-e89b-12d3-a456-426614174000',
 *   price_cents: 5000, // $50.00
 *   qty: 2,
 *   qr_storage_path: 'pending-upload/abc123'
 * })
 *
 * if (result.error) {
 *   console.error('Failed to create listing:', result.error)
 * } else {
 *   console.log('Created ask:', result.askId)
 * }
 * ```
 */
export async function createAsk(
  supabase: SupabaseClient,
  params: CreateAskParams
): Promise<CreateAskResult> {
  try {
    // Call RPC function
    const { data, error } = await supabase.rpc('rpc_create_ask', {
      event_id: params.event_id,
      price_cents: params.price_cents,
      qty: params.qty,
      qr_storage_path: params.qr_storage_path,
      seller_id: params.seller_id,
    })

    if (error) {
      // Log FULL error object for debugging
      console.error('[createAsk] RPC error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        fullError: JSON.stringify(error, null, 2),
      })

      // Build detailed error message from all available info
      const errorParts: string[] = []
      if (error.message) errorParts.push(error.message)
      if (error.details) errorParts.push(`Details: ${error.details}`)
      if (error.hint) errorParts.push(`Hint: ${error.hint}`)
      if (error.code) errorParts.push(`Code: ${error.code}`)

      const detailedError = errorParts.length > 0
        ? errorParts.join(' | ')
        : 'Failed to create listing (no error details available)'

      return {
        askId: null,
        error: detailedError,
      }
    }

    return {
      askId: data as string,
      error: null,
    }
  } catch (err) {
    console.error('[createAsk] Unexpected error:', err)
    return {
      askId: null,
      error: err instanceof Error ? err.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Create a new bid via RPC
 *
 * Calls rpc_create_bid which:
 * - Validates inputs (price_cents > 0, qty > 0)
 * - Inserts into bids table with status='open'
 * - Returns the new bid ID
 *
 * @param supabase - RLS-aware Supabase client
 * @param eventId - Event UUID
 * @param priceCents - Price in cents
 * @param qty - Quantity
 * @param buyerId - Clerk user ID
 * @returns Bid ID if successful, error message if failed
 */
export async function createBid(
  supabase: SupabaseClient,
  eventId: string,
  priceCents: number,
  qty: number,
  buyerId: string
): Promise<{ bidId: string | null; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc('rpc_create_bid', {
      event_id: eventId,
      price_cents: priceCents,
      qty,
      buyer_id: buyerId,
    })

    if (error) {
      // Log FULL error object for debugging
      console.error('[createBid] RPC error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        fullError: JSON.stringify(error, null, 2),
      })

      // Build detailed error message from all available info
      const errorParts: string[] = []
      if (error.message) errorParts.push(error.message)
      if (error.details) errorParts.push(`Details: ${error.details}`)
      if (error.hint) errorParts.push(`Hint: ${error.hint}`)
      if (error.code) errorParts.push(`Code: ${error.code}`)

      const detailedError = errorParts.length > 0
        ? errorParts.join(' | ')
        : 'Failed to create bid (no error details available)'

      return {
        bidId: null,
        error: detailedError,
      }
    }

    return {
      bidId: data as string,
      error: null,
    }
  } catch (err) {
    console.error('[createBid] Unexpected error:', err)
    return {
      bidId: null,
      error: err instanceof Error ? err.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Get order book for an event
 *
 * @param supabase - RLS-aware Supabase client
 * @param eventId - Event UUID
 * @returns Order book entries grouped by price level
 */
export async function getOrderBook(
  supabase: SupabaseClient,
  eventId: string
): Promise<{
  data: Array<{ book_side: string; price_cents: number; qty: number }>
  error: string | null
}> {
  try {
    const { data, error } = await supabase.rpc('rpc_get_book', {
      event_id: eventId,
    })

    if (error) {
      console.error('RPC error fetching order book:', error)
      return {
        data: [],
        error: error.message || 'Failed to fetch order book',
      }
    }

    return {
      data: data || [],
      error: null,
    }
  } catch (err) {
    console.error('Unexpected error fetching order book:', err)
    return {
      data: [],
      error: err instanceof Error ? err.message : 'An unexpected error occurred',
    }
  }
}
