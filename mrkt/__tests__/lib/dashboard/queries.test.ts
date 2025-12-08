/**
 * Dashboard Query Tests: lib/dashboard/queries.ts
 *
 * Tests for dashboard data fetching functions, covering:
 * - getUpcomingEvents: Fetching future events for Market tab
 * - RLS policy enforcement
 * - Service role fallback mechanism
 * - Date/time filtering logic
 * - Error handling
 *
 * Related to: MRK-45 (Bug: Events missing from Market tab event list)
 */

import type { SupabaseClient } from '@supabase/supabase-js'

// Create mock function outside to share reference
const mockGetServiceClient = jest.fn()

// Mock service client - use factory function to ensure dynamic import works
jest.mock('@/lib/supabase/server/serviceClient', () => ({
  getServiceClient: mockGetServiceClient,
}))

// Import after mocks are set up
import { getUpcomingEvents } from '@/lib/dashboard/queries'

describe('getUpcomingEvents', () => {
  let mockSupabase: any
  let mockServiceClient: any

  const FUTURE_DATE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
  const PAST_DATE = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago

  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock: Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
    }

    // Default mock: Service role client (used as fallback)
    mockServiceClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
    }

    mockGetServiceClient.mockReturnValue(mockServiceClient)
  })

  describe('Success Cases', () => {
    it('should return upcoming events ordered by start time', async () => {
      const mockEvents = [
        {
          id: 'event_1',
          title: 'Event 1',
          org: 'Club A',
          starts_at: FUTURE_DATE,
        },
        {
          id: 'event_2',
          title: 'Event 2',
          org: 'Club B',
          starts_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ]

      mockSupabase.order.mockResolvedValue({
        data: mockEvents,
        error: null,
      })

      const result = await getUpcomingEvents(mockSupabase as unknown as SupabaseClient)

      expect(result.data).toEqual(mockEvents)
      expect(result.error).toBeNull()
      expect(mockSupabase.from).toHaveBeenCalledWith('events')
      expect(mockSupabase.select).toHaveBeenCalledWith('*')
      expect(mockSupabase.order).toHaveBeenCalledWith('starts_at', { ascending: true })
    })

    it('should filter events by starts_at > now()', async () => {
      const futureEvent = {
        id: 'event_future',
        title: 'Future Event',
        org: 'Club A',
        starts_at: FUTURE_DATE,
      }

      mockSupabase.order.mockResolvedValue({
        data: [futureEvent],
        error: null,
      })

      await getUpcomingEvents(mockSupabase as unknown as SupabaseClient)

      // Verify gt was called with starts_at and a timestamp
      expect(mockSupabase.gt).toHaveBeenCalled()
      const gtCall = mockSupabase.gt.mock.calls[0]
      expect(gtCall[0]).toBe('starts_at')
      // Verify the second argument is a valid ISO date string
      expect(gtCall[1]).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should return empty array when no upcoming events exist', async () => {
      mockSupabase.order.mockResolvedValue({
        data: [],
        error: null,
      })

      // Also mock service client for fallback
      mockServiceClient.order.mockResolvedValue({
        data: [],
        error: null,
      })

      const result = await getUpcomingEvents(mockSupabase as unknown as SupabaseClient)

      expect(result.data).toEqual([])
      expect(result.error).toBeNull()
    })
  })

  describe('RLS Policy and Service Role Fallback', () => {
    it('should use service role client when RLS returns empty data', async () => {
      // First query (RLS client) returns empty
      mockSupabase.order.mockResolvedValue({
        data: [],
        error: null,
      })

      // Service role client returns actual data
      const mockEvents = [
        {
          id: 'event_1',
          title: 'Event 1',
          org: 'Club A',
          starts_at: FUTURE_DATE,
        },
      ]

      mockServiceClient.order.mockResolvedValue({
        data: mockEvents,
        error: null,
      })

      const result = await getUpcomingEvents(mockSupabase as unknown as SupabaseClient)

      // Should fallback to service role and return events
      expect(result.data).toEqual(mockEvents)
      expect(result.error).toBeNull()
      expect(mockGetServiceClient).toHaveBeenCalledWith({ functionName: 'dashboard-events' })
    })

    it('should use service role client when RLS returns null data', async () => {
      // RLS client returns null (blocked by RLS)
      mockSupabase.order.mockResolvedValue({
        data: null,
        error: null,
      })

      const mockEvents = [
        {
          id: 'event_1',
          title: 'Event 1',
          org: 'Club A',
          starts_at: FUTURE_DATE,
        },
      ]

      mockServiceClient.order.mockResolvedValue({
        data: mockEvents,
        error: null,
      })

      const result = await getUpcomingEvents(mockSupabase as unknown as SupabaseClient)

      expect(result.data).toEqual(mockEvents)
      expect(mockGetServiceClient).toHaveBeenCalled()
    })

    it('should not use service role if RLS client returns events successfully', async () => {
      const mockEvents = [
        {
          id: 'event_1',
          title: 'Event 1',
          org: 'Club A',
          starts_at: FUTURE_DATE,
        },
      ]

      mockSupabase.order.mockResolvedValue({
        data: mockEvents,
        error: null,
      })

      await getUpcomingEvents(mockSupabase as unknown as SupabaseClient)

      // Service client should not be called if RLS works
      expect(mockGetServiceClient).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should return error message when query fails', async () => {
      mockSupabase.order.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      })

      // Service role also fails
      mockServiceClient.order.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      })

      const result = await getUpcomingEvents(mockSupabase as unknown as SupabaseClient)

      expect(result.data).toEqual([])
      expect(result.error).toBe('Database connection failed')
    })

    it('should handle unexpected errors gracefully', async () => {
      mockSupabase.order.mockRejectedValue(new Error('Unexpected error'))

      const result = await getUpcomingEvents(mockSupabase as unknown as SupabaseClient)

      expect(result.data).toEqual([])
      expect(result.error).toBe('Unexpected error occurred')
    })

    it('should return empty array and error on service role failure', async () => {
      // RLS returns empty
      mockSupabase.order.mockResolvedValue({
        data: [],
        error: null,
      })

      // Service role also returns error
      mockServiceClient.order.mockResolvedValue({
        data: null,
        error: { message: 'Service role authentication failed' },
      })

      const result = await getUpcomingEvents(mockSupabase as unknown as SupabaseClient)

      expect(result.data).toEqual([])
      expect(result.error).toBe('Service role authentication failed')
    })
  })

  describe('Data Integrity', () => {
    it('should handle events with null or undefined fields gracefully', async () => {
      const mockEvents = [
        {
          id: 'event_1',
          title: 'Event 1',
          org: null, // Nullable field
          starts_at: FUTURE_DATE,
        },
      ]

      mockSupabase.order.mockResolvedValue({
        data: mockEvents,
        error: null,
      })

      const result = await getUpcomingEvents(mockSupabase as unknown as SupabaseClient)

      expect(result.data).toEqual(mockEvents)
      expect(result.error).toBeNull()
    })

    it('should return all events regardless of who created them', async () => {
      const mockEvents = [
        {
          id: 'event_1',
          title: 'Event by User A',
          org: 'Club A',
          starts_at: FUTURE_DATE,
          created_by: 'user_a',
        },
        {
          id: 'event_2',
          title: 'Event by User B',
          org: 'Club B',
          starts_at: FUTURE_DATE,
          created_by: 'user_b',
        },
      ]

      mockSupabase.order.mockResolvedValue({
        data: mockEvents,
        error: null,
      })

      const result = await getUpcomingEvents(mockSupabase as unknown as SupabaseClient)

      // All events should be visible (public data)
      expect(result.data).toHaveLength(2)
      expect(result.error).toBeNull()
    })
  })

  describe('Edge Cases', () => {
    it('should handle events with starts_at exactly at current time', async () => {
      const nowDate = new Date().toISOString()

      mockSupabase.order.mockResolvedValue({
        data: [],
        error: null,
      })

      // Mock service client for fallback
      mockServiceClient.order.mockResolvedValue({
        data: [],
        error: null,
      })

      await getUpcomingEvents(mockSupabase as unknown as SupabaseClient)

      // Query should use gt (greater than), not gte (greater than or equal)
      expect(mockSupabase.gt).toHaveBeenCalled()
    })

    it('should handle large number of events', async () => {
      const mockEvents = Array.from({ length: 100 }, (_, i) => ({
        id: `event_${i}`,
        title: `Event ${i}`,
        org: `Club ${i}`,
        starts_at: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
      }))

      mockSupabase.order.mockResolvedValue({
        data: mockEvents,
        error: null,
      })

      const result = await getUpcomingEvents(mockSupabase as unknown as SupabaseClient)

      expect(result.data).toHaveLength(100)
      expect(result.error).toBeNull()
    })

    it('should order events by starts_at in ascending order', async () => {
      const mockEvents = [
        {
          id: 'event_1',
          title: 'Near Event',
          org: 'Club A',
          starts_at: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'event_2',
          title: 'Far Event',
          org: 'Club B',
          starts_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ]

      mockSupabase.order.mockResolvedValue({
        data: mockEvents,
        error: null,
      })

      const result = await getUpcomingEvents(mockSupabase as unknown as SupabaseClient)

      expect(result.data[0].title).toBe('Near Event')
      expect(result.data[1].title).toBe('Far Event')
      expect(mockSupabase.order).toHaveBeenCalledWith('starts_at', { ascending: true })
    })
  })
})
