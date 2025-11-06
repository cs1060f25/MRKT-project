/**
 * Dashboard Query Helpers
 *
 * Server-side query functions for dashboard data.
 * All queries use RLS-aware Supabase client.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Event, Bid, Ask, Ticket, BookEntry, QueryResult } from './types'

/**
 * Get upcoming events (starts_at > now())
 * @param supabase - RLS-aware Supabase client
 * @returns Events ordered by start time
 */
export async function getUpcomingEvents(
  supabase: SupabaseClient
): Promise<QueryResult<Event[]>> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gt('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true })

    if (error) {
      console.warn('Failed to fetch upcoming events:', error)
      return { data: [], error: error.message }
    }

    return { data: data || [], error: null }
  } catch (err) {
    console.error('Unexpected error fetching events:', err)
    return { data: [], error: 'Unexpected error occurred' }
  }
}

/**
 * Get user's bids with event information
 * @param supabase - RLS-aware Supabase client
 * @param userId - Current user ID (from Clerk)
 * @returns User's bids with joined event data
 */
export async function getUserBids(
  supabase: SupabaseClient,
  userId: string
): Promise<QueryResult<Bid[]>> {
  try {
    const { data, error } = await supabase
      .from('bids')
      .select(`
        *,
        event:events(title, starts_at)
      `)
      .eq('buyer_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('Failed to fetch user bids:', error)
      return { data: [], error: error.message }
    }

    // Type assertion needed because Supabase types don't infer nested selects
    const bids = (data || []).map((bid: any) => ({
      ...bid,
      event: {
        title: bid.event?.title || 'Unknown Event',
        starts_at: bid.event?.starts_at || '',
      },
    })) as Bid[]

    return { data: bids, error: null }
  } catch (err) {
    console.error('Unexpected error fetching user bids:', err)
    return { data: [], error: 'Unexpected error occurred' }
  }
}

/**
 * Get user's listings (asks) with event information
 * @param supabase - RLS-aware Supabase client
 * @param userId - Current user ID (from Clerk)
 * @returns User's listings with joined event data
 */
export async function getUserListings(
  supabase: SupabaseClient,
  userId: string
): Promise<QueryResult<Ask[]>> {
  try {
    const { data, error } = await supabase
      .from('asks')
      .select(`
        *,
        event:events(title, starts_at)
      `)
      .eq('seller_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('Failed to fetch user listings:', error)
      return { data: [], error: error.message }
    }

    // Type assertion for nested selects
    const listings = (data || []).map((ask: any) => ({
      ...ask,
      event: {
        title: ask.event?.title || 'Unknown Event',
        starts_at: ask.event?.starts_at || '',
      },
    })) as Ask[]

    return { data: listings, error: null }
  } catch (err) {
    console.error('Unexpected error fetching user listings:', err)
    return { data: [], error: 'Unexpected error occurred' }
  }
}

/**
 * Get user's tickets with match and event information
 * @param supabase - RLS-aware Supabase client
 * @param userId - Current user ID (from Clerk)
 * @returns User's tickets with joined match and event data
 */
export async function getUserTickets(
  supabase: SupabaseClient,
  userId: string
): Promise<QueryResult<Ticket[]>> {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        match:matches(event_id, clearing_price_cents, created_at),
        event:matches(event:events(title, starts_at))
      `)
      .eq('winner_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('Failed to fetch user tickets:', error)
      return { data: [], error: error.message }
    }

    // Transform nested data structure
    const tickets = (data || []).map((ticket: any) => ({
      id: ticket.id,
      match_id: ticket.match_id,
      winner_id: ticket.winner_id,
      qr_storage_path: ticket.qr_storage_path,
      delivered_at: ticket.delivered_at,
      created_at: ticket.created_at,
      match: {
        event_id: ticket.match?.event_id || '',
        clearing_price_cents: ticket.match?.clearing_price_cents || 0,
        created_at: ticket.match?.created_at || '',
      },
      event: {
        title: ticket.event?.event?.title || 'Unknown Event',
        starts_at: ticket.event?.event?.starts_at || '',
      },
    })) as Ticket[]

    return { data: tickets, error: null }
  } catch (err) {
    console.error('Unexpected error fetching user tickets:', err)
    return { data: [], error: 'Unexpected error occurred' }
  }
}

/**
 * Get order book preview for an event (top 3 levels per side)
 * @param supabase - RLS-aware Supabase client
 * @param eventId - Event ID
 * @returns Order book entries (asks and bids)
 */
export async function getBookPreview(
  supabase: SupabaseClient,
  eventId: string
): Promise<QueryResult<BookEntry[]>> {
  try {
    const { data, error } = await supabase.rpc('rpc_get_book', {
      event_id: eventId,
    })

    if (error) {
      console.warn(`Failed to fetch book for event ${eventId}:`, error)
      return { data: [], error: error.message }
    }

    // Limit to top 3 price levels per side
    const book = (data || []) as BookEntry[]
    const asks = book
      .filter((entry) => entry.book_side === 'ask')
      .slice(0, 3)
    const bids = book
      .filter((entry) => entry.book_side === 'bid')
      .slice(-3) // Take last 3 (highest bids)
      .reverse() // Reverse to show highest first

    return { data: [...asks, ...bids], error: null }
  } catch (err) {
    console.error(`Unexpected error fetching book for event ${eventId}:`, err)
    return { data: [], error: 'Unexpected error occurred' }
  }
}

/**
 * Health check using rpc_health
 * @param supabase - RLS-aware Supabase client
 * @returns Health status
 */
export async function healthCheck(
  supabase: SupabaseClient
): Promise<QueryResult<string>> {
  try {
    const { data, error } = await supabase.rpc('rpc_health')

    if (error) {
      console.warn('Health check failed:', error)
      return { data: 'error', error: error.message }
    }

    return { data: data || 'ok', error: null }
  } catch (err) {
    console.error('Unexpected error in health check:', err)
    return { data: 'error', error: 'Unexpected error occurred' }
  }
}
