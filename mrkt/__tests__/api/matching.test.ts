/**
 * API Route Tests: /api/events/[eventId]/match
 *
 * Tests for matching algorithm execution endpoint, covering:
 * - Authentication
 * - Event ID validation
 * - Matching algorithm logic
 * - Database operations (match creation, ticket creation, order updates)
 * - Error handling
 * - Edge cases (no orders, no crossing orders, partial matches)
 *
 * Related to: MRK-44 (Bug: Matching algorithm failing to execute)
 */

import { POST } from '@/app/api/events/[eventId]/match/route'
import { NextRequest } from 'next/server'

// Mock Clerk auth
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}))

// Mock Supabase service client
jest.mock('@/lib/supabase/server', () => ({
  getServiceClient: jest.fn(),
}))

import { auth } from '@clerk/nextjs/server'
import { getServiceClient } from '@/lib/supabase/server'

describe('POST /api/events/[eventId]/match', () => {
  let mockSupabase: any
  const mockAuth = auth as jest.Mock
  const mockGetServiceClient = getServiceClient as jest.Mock

  const TEST_EVENT_ID = '123e4567-e89b-12d3-a456-426614174000'
  const TEST_ASK_ID = 'ask_123'
  const TEST_BID_ID = 'bid_123'
  const TEST_MATCH_ID = 'match_123'

  // Helper to create a chainable mock that supports double .order() chains
  const createTableMock = (data: any[], error: any = null) => {
    let chainState = {
      selectCalled: false,
      eqCalls: 0,
      orderCalls: 0,
    }

    const chainable: any = {
      select: jest.fn(() => {
        chainState.selectCalled = true
        return chainable
      }),
      eq: jest.fn(() => {
        chainState.eqCalls++
        return chainable
      }),
      order: jest.fn(() => {
        chainState.orderCalls++
        // On second order() call, return the promise with data
        // (matching routes use .order().order() pattern)
        if (chainState.orderCalls >= 2) {
          return Promise.resolve({ data, error })
        }
        return chainable
      }),
      insert: jest.fn(() => Promise.resolve({ error })),
      update: jest.fn(() => chainable),
      // For update().eq() chain
      then: (resolve: any) => resolve({ error }),
    }

    return chainable
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock: authenticated user
    mockAuth.mockResolvedValue({ userId: 'user_test123' })

    // Default mock: Supabase client with chainable methods
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
    }
    mockGetServiceClient.mockReturnValue(mockSupabase)
  })

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: null })

      const request = new NextRequest(
        `http://localhost:3000/api/events/${TEST_EVENT_ID}/match`,
        { method: 'POST' }
      )

      const response = await POST(request, {
        params: Promise.resolve({ eventId: TEST_EVENT_ID }),
      })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toContain('Unauthorized')
    })
  })

  describe('Matching Algorithm - Success Cases', () => {
    it('should successfully match one ask with one bid', async () => {
      const asksData = [
        {
          id: TEST_ASK_ID,
          seller_id: 'seller_1',
          event_id: TEST_EVENT_ID,
          price_cents: 5000,
          qty: 1,
          status: 'open',
          qr_storage_path: 'qr/ticket1.png',
        },
      ]

      const bidsData = [
        {
          id: TEST_BID_ID,
          buyer_id: 'buyer_1',
          event_id: TEST_EVENT_ID,
          price_cents: 6000,
          qty: 1,
          status: 'open',
        },
      ]

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'asks') return createTableMock(asksData)
        if (table === 'bids') return createTableMock(bidsData)
        if (table === 'matches') return createTableMock([], null)
        if (table === 'tickets') return createTableMock([], null)
        return createTableMock([])
      })

      const request = new NextRequest(
        `http://localhost:3000/api/events/${TEST_EVENT_ID}/match`,
        { method: 'POST' }
      )

      const response = await POST(request, {
        params: Promise.resolve({ eventId: TEST_EVENT_ID }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.matchesCount).toBe(1)
      expect(data.matches).toHaveLength(1)
      expect(data.matches[0]).toMatchObject({
        event_id: TEST_EVENT_ID,
        ask_id: TEST_ASK_ID,
        bid_id: TEST_BID_ID,
        clearing_price_cents: 5000, // Ask floor price
        qty: 1,
      })
    })

    it('should handle partial quantity matching correctly', async () => {
      const asksData = [
        {
          id: TEST_ASK_ID,
          seller_id: 'seller_1',
          event_id: TEST_EVENT_ID,
          price_cents: 5000,
          qty: 3,
          status: 'open',
          qr_storage_path: 'qr/ticket1.png',
        },
      ]

      const bidsData = [
        {
          id: TEST_BID_ID,
          buyer_id: 'buyer_1',
          event_id: TEST_EVENT_ID,
          price_cents: 6000,
          qty: 2,
          status: 'open',
        },
      ]

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'asks') return createTableMock(asksData)
        if (table === 'bids') return createTableMock(bidsData)
        if (table === 'matches') return createTableMock([], null)
        if (table === 'tickets') return createTableMock([], null)
        return createTableMock([])
      })

      const request = new NextRequest(
        `http://localhost:3000/api/events/${TEST_EVENT_ID}/match`,
        { method: 'POST' }
      )

      const response = await POST(request, {
        params: Promise.resolve({ eventId: TEST_EVENT_ID }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.matchesCount).toBe(1)
      expect(data.matches[0].qty).toBe(2) // Min of ask qty (3) and bid qty (2)
    })
  })

  describe('Matching Algorithm - No Match Cases', () => {
    it('should return zero matches when no asks exist', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'asks') return createTableMock([])
        if (table === 'bids') {
          return createTableMock([
            {
              id: TEST_BID_ID,
              buyer_id: 'buyer_1',
              event_id: TEST_EVENT_ID,
              price_cents: 6000,
              qty: 1,
              status: 'open',
            },
          ])
        }
        return createTableMock([])
      })

      const request = new NextRequest(
        `http://localhost:3000/api/events/${TEST_EVENT_ID}/match`,
        { method: 'POST' }
      )

      const response = await POST(request, {
        params: Promise.resolve({ eventId: TEST_EVENT_ID }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.matchesCount).toBe(0)
    })

    it('should not match when bid price is below ask price', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'asks') {
          return createTableMock([
            {
              id: TEST_ASK_ID,
              seller_id: 'seller_1',
              event_id: TEST_EVENT_ID,
              price_cents: 7000,
              qty: 1,
              status: 'open',
              qr_storage_path: 'qr/ticket1.png',
            },
          ])
        }
        if (table === 'bids') {
          return createTableMock([
            {
              id: TEST_BID_ID,
              buyer_id: 'buyer_1',
              event_id: TEST_EVENT_ID,
              price_cents: 5000, // Below ask price
              qty: 1,
              status: 'open',
            },
          ])
        }
        return createTableMock([])
      })

      const request = new NextRequest(
        `http://localhost:3000/api/events/${TEST_EVENT_ID}/match`,
        { method: 'POST' }
      )

      const response = await POST(request, {
        params: Promise.resolve({ eventId: TEST_EVENT_ID }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.matchesCount).toBe(0)
    })

    it('should not allow self-matching (seller_id == buyer_id)', async () => {
      const SAME_USER_ID = 'user_same'

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'asks') {
          return createTableMock([
            {
              id: TEST_ASK_ID,
              seller_id: SAME_USER_ID,
              event_id: TEST_EVENT_ID,
              price_cents: 5000,
              qty: 1,
              status: 'open',
              qr_storage_path: 'qr/ticket1.png',
            },
          ])
        }
        if (table === 'bids') {
          return createTableMock([
            {
              id: TEST_BID_ID,
              buyer_id: SAME_USER_ID, // Same as seller
              event_id: TEST_EVENT_ID,
              price_cents: 6000,
              qty: 1,
              status: 'open',
            },
          ])
        }
        return createTableMock([])
      })

      const request = new NextRequest(
        `http://localhost:3000/api/events/${TEST_EVENT_ID}/match`,
        { method: 'POST' }
      )

      const response = await POST(request, {
        params: Promise.resolve({ eventId: TEST_EVENT_ID }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.matchesCount).toBe(0)
    })
  })

  describe('Error Handling', () => {
    it('should return 500 when asks query fails', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'asks') {
          return createTableMock(null as any, { message: 'Database connection error' })
        }
        return createTableMock([])
      })

      const request = new NextRequest(
        `http://localhost:3000/api/events/${TEST_EVENT_ID}/match`,
        { method: 'POST' }
      )

      const response = await POST(request, {
        params: Promise.resolve({ eventId: TEST_EVENT_ID }),
      })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to execute matching algorithm')
    })

    it('should return 500 when match insertion fails', async () => {
      const asksData = [
        {
          id: TEST_ASK_ID,
          seller_id: 'seller_1',
          event_id: TEST_EVENT_ID,
          price_cents: 5000,
          qty: 1,
          status: 'open',
          qr_storage_path: 'qr/ticket1.png',
        },
      ]

      const bidsData = [
        {
          id: TEST_BID_ID,
          buyer_id: 'buyer_1',
          event_id: TEST_EVENT_ID,
          price_cents: 6000,
          qty: 1,
          status: 'open',
        },
      ]

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'asks') return createTableMock(asksData)
        if (table === 'bids') return createTableMock(bidsData)
        if (table === 'matches') {
          return {
            insert: jest.fn().mockResolvedValue({
              error: { message: 'Foreign key constraint violation' },
            }),
          }
        }
        return createTableMock([])
      })

      const request = new NextRequest(
        `http://localhost:3000/api/events/${TEST_EVENT_ID}/match`,
        { method: 'POST' }
      )

      const response = await POST(request, {
        params: Promise.resolve({ eventId: TEST_EVENT_ID }),
      })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to execute matching algorithm')
    })
  })

  describe('Clearing Price Logic', () => {
    it('should set clearing price to ask floor (ask price)', async () => {
      const ASK_PRICE = 5000
      const BID_PRICE = 7000

      const asksData = [
        {
          id: TEST_ASK_ID,
          seller_id: 'seller_1',
          event_id: TEST_EVENT_ID,
          price_cents: ASK_PRICE,
          qty: 1,
          status: 'open',
          qr_storage_path: 'qr/ticket1.png',
        },
      ]

      const bidsData = [
        {
          id: TEST_BID_ID,
          buyer_id: 'buyer_1',
          event_id: TEST_EVENT_ID,
          price_cents: BID_PRICE,
          qty: 1,
          status: 'open',
        },
      ]

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'asks') return createTableMock(asksData)
        if (table === 'bids') return createTableMock(bidsData)
        if (table === 'matches') return createTableMock([], null)
        if (table === 'tickets') return createTableMock([], null)
        return createTableMock([])
      })

      const request = new NextRequest(
        `http://localhost:3000/api/events/${TEST_EVENT_ID}/match`,
        { method: 'POST' }
      )

      const response = await POST(request, {
        params: Promise.resolve({ eventId: TEST_EVENT_ID }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.matches[0].clearing_price_cents).toBe(ASK_PRICE)
    })
  })
})
