/**
 * Integration Test: Create Event -> Post Listing
 *
 * Tests the complete flow:
 * 1. Create an event via POST /api/events/create
 * 2. Create a listing for that event via POST /api/listings
 *
 * Note: QR upload functionality is tested via unit tests in storage.test.ts
 * File upload with FormData in jsdom has compatibility issues with NextRequest.
 *
 * Uses mocked Clerk auth and Supabase to test full API chain.
 */

import { POST as createEvent } from '@/app/api/events/create/route'
import { POST as createListing } from '@/app/api/listings/route'
import { NextRequest } from 'next/server'

// Mock Clerk auth
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
  currentUser: jest.fn(),
}))

// Mock Supabase service client
jest.mock('@/lib/supabase/server/serviceClient', () => ({
  getServiceClient: jest.fn(),
}))

// Mock user management
jest.mock('@/lib/supabase/users', () => ({
  ensureUserExists: jest.fn(),
}))

import { auth, currentUser } from '@clerk/nextjs/server'
import { getServiceClient } from '@/lib/supabase/server/serviceClient'
import { ensureUserExists } from '@/lib/supabase/users'

describe('Integration: Create Event -> Post Listing', () => {
  const TEST_USER_ID = 'user_seller_integration_test'
  const TEST_EVENT_ID = '123e4567-e89b-12d3-a456-426614174000'
  const TEST_ASK_ID = '123e4567-e89b-12d3-a456-426614174001'

  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup authenticated user (seller)
    ;(auth as jest.Mock).mockResolvedValue({ userId: TEST_USER_ID })
    ;(currentUser as jest.Mock).mockResolvedValue({
      id: TEST_USER_ID,
      firstName: 'Test',
      lastName: 'Seller',
      emailAddresses: [{ emailAddress: 'seller@test.com' }],
    })

    // Setup Supabase mock with chainable methods
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      storage: {
        from: jest.fn().mockReturnValue({
          upload: jest.fn().mockResolvedValue({
            data: { path: `${TEST_EVENT_ID}/${TEST_ASK_ID}/qr.png` },
            error: null,
          }),
        }),
      },
    }
    ;(getServiceClient as jest.Mock).mockReturnValue(mockSupabase)
    ;(ensureUserExists as jest.Mock).mockResolvedValue({
      id: TEST_USER_ID,
      email: 'seller@test.com',
      full_name: 'Test Seller',
    })
  })

  describe('Happy Path', () => {
    it('should complete full flow: create event -> create listing', async () => {
      // ========================================
      // Step 1: Create Event
      // ========================================
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      const endDate = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString()

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: TEST_EVENT_ID,
          title: 'Integration Test Concert',
          org: 'Test Organization',
          starts_at: futureDate,
          ends_at: endDate,
          created_by: TEST_USER_ID,
          created_at: new Date().toISOString(),
        },
        error: null,
      })

      const eventRequest = new NextRequest('http://localhost:3000/api/events/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Integration Test Concert',
          org: 'Test Organization',
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
      // Step 2: Create Listing
      // ========================================
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: TEST_ASK_ID,
          event_id: TEST_EVENT_ID,
          seller_id: TEST_USER_ID,
          price_cents: 5000,
          qty: 2,
          qr_storage_path: `pending/${TEST_ASK_ID}`,
          status: 'open',
          created_at: new Date().toISOString(),
        },
        error: null,
      })

      const listingRequest = new NextRequest('http://localhost:3000/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: TEST_EVENT_ID,
          price_cents: 5000,
          qty: 2,
          qr_storage_path: 'pending-upload.png',
        }),
      })

      const listingResponse = await createListing(listingRequest)
      const listingData = await listingResponse.json()

      expect(listingResponse.status).toBe(200)
      expect(listingData.askId).toBeDefined()
      expect(listingData.error).toBeNull()

      // Verify the listing is connected to the event
      // (in a real scenario, we'd verify this in the database)
      expect(mockSupabase.insert).toHaveBeenCalled()
    })
  })

  describe('Error Cases', () => {
    it('should fail listing creation with non-existent event', async () => {
      // Mock database error for foreign key violation
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: {
          code: '23503',
          message: 'insert or update on table "asks" violates foreign key constraint "asks_event_id_fkey"',
        },
      })

      const request = new NextRequest('http://localhost:3000/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: '00000000-0000-0000-0000-000000000000',
          price_cents: 5000,
          qty: 2,
          qr_storage_path: 'test.png',
        }),
      })

      const response = await createListing(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toContain('event does not exist')
    })

    it('should fail event creation without authentication', async () => {
      // Override auth to return no userId
      ;(auth as jest.Mock).mockResolvedValueOnce({ userId: null })

      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      const endDate = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString()

      const request = new NextRequest('http://localhost:3000/api/events/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Event',
          org: 'Test Org',
          startsAt: futureDate,
          endsAt: endDate,
        }),
      })

      const response = await createEvent(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toContain('Unauthorized')
    })

    it('should fail listing creation without authentication', async () => {
      // Override auth to return no userId
      ;(auth as jest.Mock).mockResolvedValueOnce({ userId: null })

      const request = new NextRequest('http://localhost:3000/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: TEST_EVENT_ID,
          price_cents: 5000,
          qty: 2,
          qr_storage_path: 'test.png',
        }),
      })

      const response = await createListing(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toContain('Unauthorized')
    })
  })
})
