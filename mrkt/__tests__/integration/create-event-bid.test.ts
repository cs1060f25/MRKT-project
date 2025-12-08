/**
 * Integration Test: Create Event -> Place Bid
 *
 * Tests the complete flow:
 * 1. Create an event via POST /api/events/create
 * 2. Place a bid on that event via POST /api/bids/create
 *
 * Uses mocked Clerk auth and Supabase to test full API chain.
 */

import { POST as createEvent } from '@/app/api/events/create/route'
import { POST as createBid } from '@/app/api/bids/create/route'
import { NextRequest } from 'next/server'

// Mock Clerk auth
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
  currentUser: jest.fn(),
}))

// Mock Supabase service client (for events/create route)
jest.mock('@/lib/supabase/server/serviceClient', () => ({
  getServiceClient: jest.fn(),
}))

// Mock Supabase server (for bids/create route)
jest.mock('@/lib/supabase/server', () => ({
  getServiceClient: jest.fn(),
}))

// Mock user management
jest.mock('@/lib/supabase/users', () => ({
  ensureUserExists: jest.fn(),
}))

import { auth, currentUser } from '@clerk/nextjs/server'
import { getServiceClient as getServiceClientFromServiceClient } from '@/lib/supabase/server/serviceClient'
import { getServiceClient as getServiceClientFromServer } from '@/lib/supabase/server'
import { ensureUserExists } from '@/lib/supabase/users'

describe('Integration: Create Event -> Place Bid', () => {
  const TEST_BUYER_ID = 'user_buyer_integration_test'
  const TEST_EVENT_ID = '123e4567-e89b-12d3-a456-426614174002'
  const TEST_BID_ID = '123e4567-e89b-12d3-a456-426614174003'

  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup authenticated user (buyer)
    ;(auth as jest.Mock).mockResolvedValue({ userId: TEST_BUYER_ID })
    ;(currentUser as jest.Mock).mockResolvedValue({
      id: TEST_BUYER_ID,
      firstName: 'Test',
      lastName: 'Buyer',
      emailAddresses: [{ emailAddress: 'buyer@test.com' }],
    })

    // Setup Supabase mock with chainable methods
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    }

    // Both service client imports should return the same mock
    ;(getServiceClientFromServiceClient as jest.Mock).mockReturnValue(mockSupabase)
    ;(getServiceClientFromServer as jest.Mock).mockReturnValue(mockSupabase)
    ;(ensureUserExists as jest.Mock).mockResolvedValue({
      id: TEST_BUYER_ID,
      email: 'buyer@test.com',
      full_name: 'Test Buyer',
    })
  })

  describe('Happy Path', () => {
    it('should complete full flow: create event -> place bid', async () => {
      // ========================================
      // Step 1: Create Event
      // ========================================
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      const endDate = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString()

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: TEST_EVENT_ID,
          title: 'Concert for Bidding',
          org: 'Music Club',
          starts_at: futureDate,
          ends_at: endDate,
          created_by: TEST_BUYER_ID,
          created_at: new Date().toISOString(),
        },
        error: null,
      })

      const eventRequest = new NextRequest('http://localhost:3000/api/events/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Concert for Bidding',
          org: 'Music Club',
          startsAt: futureDate,
          endsAt: endDate,
        }),
      })

      const eventResponse = await createEvent(eventRequest)
      const eventData = await eventResponse.json()

      expect(eventResponse.status).toBe(200)
      expect(eventData.eventId).toBe(TEST_EVENT_ID)
      expect(eventData.error).toBeNull()

      // ========================================
      // Step 2: Place Bid
      // ========================================
      // Mock user lookup (user already exists)
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: TEST_BUYER_ID },
        error: null,
      })

      // Mock event lookup
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: TEST_EVENT_ID,
          ends_at: endDate, // Future date - event not ended
        },
        error: null,
      })

      // Mock bid creation
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: TEST_BID_ID,
          event_id: TEST_EVENT_ID,
          buyer_id: TEST_BUYER_ID,
          price_cents: 7500,
          qty: 2,
          status: 'open',
          created_at: new Date().toISOString(),
        },
        error: null,
      })

      const bidRequest = new NextRequest('http://localhost:3000/api/bids/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: TEST_EVENT_ID,
          priceCents: 7500,
          qty: 2,
          buyerId: TEST_BUYER_ID,
        }),
      })

      const bidResponse = await createBid(bidRequest)
      const bidData = await bidResponse.json()

      expect(bidResponse.status).toBe(200)
      expect(bidData.success).toBe(true)
      expect(bidData.bid).toBeDefined()
      expect(bidData.bid.price_cents).toBe(7500)
      expect(bidData.bid.qty).toBe(2)
      expect(bidData.bid.status).toBe('open')
    })
  })

  describe('Error Cases', () => {
    it('should prevent bidding on non-existent event', async () => {
      // Mock user lookup
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: TEST_BUYER_ID },
        error: null,
      })

      // Mock event lookup - not found
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Event not found' },
      })

      const request = new NextRequest('http://localhost:3000/api/bids/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: '00000000-0000-0000-0000-000000000000',
          priceCents: 5000,
          qty: 2,
          buyerId: TEST_BUYER_ID,
        }),
      })

      const response = await createBid(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('not found')
    })

    it('should prevent bidding on ended event', async () => {
      const pastEndDate = new Date(Date.now() - 1000).toISOString() // Event ended 1 second ago

      // Mock user lookup
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: TEST_BUYER_ID },
        error: null,
      })

      // Mock event lookup - event has ended
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: TEST_EVENT_ID,
          ends_at: pastEndDate,
        },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/bids/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: TEST_EVENT_ID,
          priceCents: 5000,
          qty: 2,
          buyerId: TEST_BUYER_ID,
        }),
      })

      const response = await createBid(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('ended')
    })

    it('should prevent creating bid for another user', async () => {
      const request = new NextRequest('http://localhost:3000/api/bids/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: TEST_EVENT_ID,
          priceCents: 5000,
          qty: 2,
          buyerId: 'different_user_id', // Different from authenticated user
        }),
      })

      const response = await createBid(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toContain('only create bids for yourself')
    })

    it('should reject bid without authentication', async () => {
      // Override auth to return no userId
      ;(auth as jest.Mock).mockResolvedValueOnce({ userId: null })

      const request = new NextRequest('http://localhost:3000/api/bids/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: TEST_EVENT_ID,
          priceCents: 5000,
          qty: 2,
          buyerId: TEST_BUYER_ID,
        }),
      })

      const response = await createBid(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toContain('Authentication required')
    })
  })
})
