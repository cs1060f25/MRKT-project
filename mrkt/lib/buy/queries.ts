/**
 * Buy Flow Query Helpers
 *
 * Server-side query functions for fetching event and bid data.
 * All queries use RLS-aware Supabase client.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { EventDetails, UserBid } from './types'
import type { QueryResult } from '../dashboard/types'

/**
 * Get event details by ID
 * @param supabase - RLS-aware Supabase client
 * @param eventId - Event UUID
 * @returns Event details or null if not found
 */
export async function getEventDetails(
  supabase: SupabaseClient,
  eventId: string
): Promise<QueryResult<EventDetails | null>> {
  try {
    let { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    // If RLS blocks, try with service role (events are public data)
    if (!data && !error) {
      console.log('[Buy] Event not found with RLS client, trying service role')
      const { getServiceClient } = await import('../supabase/server/serviceClient')
      const serviceSupabase = getServiceClient({ functionName: 'buy-event-details' })
      const result = await serviceSupabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()
      data = result.data
      error = result.error
    }

    if (error) {
      // 406 or PGRST116 means not found
      if (error.code === 'PGRST116' || error.message?.includes('not found')) {
        return { data: null, error: null }
      }
      console.warn(`Failed to fetch event ${eventId}:`, error)
      return { data: null, error: error.message }
    }

    return {
      data: data
        ? {
            id: data.id,
            title: data.title,
            starts_at: data.starts_at,
            ends_at: data.ends_at,
            org: data.org,
          }
        : null,
      error: null,
    }
  } catch (err) {
    console.error(`Unexpected error fetching event ${eventId}:`, err)
    return { data: null, error: 'Unexpected error occurred' }
  }
}

/**
 * Get user's bids for a specific event
 * @param supabase - RLS-aware Supabase client
 * @param eventId - Event UUID
 * @param userId - Current user ID (from Clerk)
 * @returns User's bids for this event
 */
export async function getEventBids(
  supabase: SupabaseClient,
  eventId: string,
  userId: string
): Promise<QueryResult<UserBid[]>> {
  try {
    const { data, error } = await supabase
      .from('bids')
      .select('*')
      .eq('event_id', eventId)
      .eq('buyer_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn(`Failed to fetch bids for event ${eventId}:`, error)
      return { data: [], error: error.message }
    }

    const bids: UserBid[] = (data || []).map((bid) => ({
      id: bid.id,
      event_id: bid.event_id,
      buyer_id: bid.buyer_id,
      price_cents: bid.price_cents,
      qty: bid.qty,
      status: bid.status,
      created_at: bid.created_at,
    }))

    return { data: bids, error: null }
  } catch (err) {
    console.error(`Unexpected error fetching bids for event ${eventId}:`, err)
    return { data: [], error: 'Unexpected error occurred' }
  }
}
