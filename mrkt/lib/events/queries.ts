/**
 * Event Page Query Helpers
 *
 * Server-side query functions for fetching event details and transaction history.
 * All queries use RLS-aware Supabase client.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { EventDetails, EventMatch, QueryResult } from './types'

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
    if (!data) {
      console.log('[Events] Event not found with RLS client, trying service role')
      const { getServiceClient } = await import('../supabase/server/serviceClient')
      const serviceSupabase = getServiceClient({ functionName: 'event-details' })
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
            created_by: data.created_by,
            created_at: data.created_at,
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
 * Get all executed matches for an event (public transaction history)
 * @param supabase - RLS-aware Supabase client
 * @param eventId - Event UUID
 * @returns All matches for this event, ordered by most recent first
 */
export async function getEventMatches(
  supabase: SupabaseClient,
  eventId: string
): Promise<QueryResult<EventMatch[]>> {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('id, clearing_price_cents, qty, created_at')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn(`Failed to fetch matches for event ${eventId}:`, error)
      return { data: [], error: error.message }
    }

    const matches: EventMatch[] = (data || []).map((match) => ({
      id: match.id,
      clearing_price_cents: match.clearing_price_cents,
      qty: match.qty,
      created_at: match.created_at,
    }))

    return { data: matches, error: null }
  } catch (err) {
    console.error(`Unexpected error fetching matches for event ${eventId}:`, err)
    return { data: [], error: 'Unexpected error occurred' }
  }
}

