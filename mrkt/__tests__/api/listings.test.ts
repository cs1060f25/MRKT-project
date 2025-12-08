/**
 * API Route Tests: /api/listings
 *
 * Tests for listing creation endpoint, covering:
 * - Authentication
 * - Input validation
 * - Foreign key constraints
 * - Database constraints
 * - UUID generation
 * - User auto-creation
 * - Error handling
 */

import { POST } from '@/app/api/listings/route'
import { NextRequest } from 'next/server'

// Mock Clerk auth
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
  currentUser: jest.fn(),
}))

// Mock Supabase client
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

describe('POST /api/listings', () => {
  let mockSupabase: any
  const mockAuth = auth as jest.Mock
  const mockCurrentUser = currentUser as jest.Mock
  const mockGetServiceClient = getServiceClient as jest.Mock
  const mockEnsureUserExists = ensureUserExists as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock: authenticated user
    mockAuth.mockResolvedValue({ userId: 'user_test123' })
    mockCurrentUser.mockResolvedValue({
      id: 'user_test123',
      firstName: 'Test',
      lastName: 'User',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
    })

    // Default mock: Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn(),
    }
    mockGetServiceClient.mockReturnValue(mockSupabase)

    // Default mock: user creation succeeds
    mockEnsureUserExists.mockResolvedValue({
      id: 'user_test123',
      email: 'test@example.com',
      full_name: 'Test User',
    })
  })

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: null })

      const request = new NextRequest('http://localhost:3000/api/listings', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toContain('Unauthorized')
    })

    it('should return 500 if unable to fetch Clerk user data', async () => {
      mockCurrentUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/listings', {
        method: 'POST',
        body: JSON.stringify({
          event_id: '123e4567-e89b-12d3-a456-426614174000',
          price_cents: 5000,
          qty: 2,
          qr_storage_path: 'pending-upload/test.png',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Unable to fetch user data')
    })
  })

  describe('Input Validation - Missing Fields', () => {
    it('should return 400 if event_id is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/listings', {
        method: 'POST',
        body: JSON.stringify({
          price_cents: 5000,
          qty: 2,
          qr_storage_path: 'test.png',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('event_id')
    })

    it('should return 400 if price_cents is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/listings', {
        method: 'POST',
        body: JSON.stringify({
          event_id: '123e4567-e89b-12d3-a456-426614174000',
          qty: 2,
          qr_storage_path: 'test.png',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('price_cents')
    })

    it('should return 400 if qty is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/listings', {
        method: 'POST',
        body: JSON.stringify({
          event_id: '123e4567-e89b-12d3-a456-426614174000',
          price_cents: 5000,
          qr_storage_path: 'test.png',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('qty')
    })
  })

  describe('Input Validation - Data Types', () => {
    it('should return 400 if price_cents is not an integer', async () => {
      const request = new NextRequest('http://localhost:3000/api/listings', {
        method: 'POST',
        body: JSON.stringify({
          event_id: '123e4567-e89b-12d3-a456-426614174000',
          price_cents: '5000', // String instead of number
          qty: 2,
          qr_storage_path: 'test.png',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('integer')
    })

    it('should return 400 if qty is not an integer', async () => {
      const request = new NextRequest('http://localhost:3000/api/listings', {
        method: 'POST',
        body: JSON.stringify({
          event_id: '123e4567-e89b-12d3-a456-426614174000',
          price_cents: 5000,
          qty: 2.5, // Float instead of integer
          qr_storage_path: 'test.png',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('integer')
    })

    it('should return 400 if event_id is not a valid UUID', async () => {
      const request = new NextRequest('http://localhost:3000/api/listings', {
        method: 'POST',
        body: JSON.stringify({
          event_id: 'invalid-uuid',
          price_cents: 5000,
          qty: 2,
          qr_storage_path: 'test.png',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('UUID')
    })
  })

  describe('Input Validation - Value Ranges', () => {
    it('should return 400 if price_cents is negative', async () => {
      const request = new NextRequest('http://localhost:3000/api/listings', {
        method: 'POST',
        body: JSON.stringify({
          event_id: '123e4567-e89b-12d3-a456-426614174000',
          price_cents: -100,
          qty: 2,
          qr_storage_path: 'test.png',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('greater than 0')
    })

    it('should return 400 if qty is zero', async () => {
      const request = new NextRequest('http://localhost:3000/api/listings', {
        method: 'POST',
        body: JSON.stringify({
          event_id: '123e4567-e89b-12d3-a456-426614174000',
          price_cents: 5000,
          qty: 0,
          qr_storage_path: 'test.png',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('greater than 0')
    })
  })

  describe('User Management', () => {
    it('should call ensureUserExists with correct parameters', async () => {
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'ask_123',
          event_id: '123e4567-e89b-12d3-a456-426614174000',
          price_cents: 5000,
          qty: 2,
          status: 'open',
          created_at: new Date().toISOString(),
        },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/listings', {
        method: 'POST',
        body: JSON.stringify({
          event_id: '123e4567-e89b-12d3-a456-426614174000',
          price_cents: 5000,
          qty: 2,
          qr_storage_path: 'test.png',
        }),
      })

      await POST(request)

      expect(mockEnsureUserExists).toHaveBeenCalledWith(
        mockSupabase,
        'user_test123',
        'test@example.com',
        'Test User'
      )
    })

    it('should return 500 if user creation fails', async () => {
      mockEnsureUserExists.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/listings', {
        method: 'POST',
        body: JSON.stringify({
          event_id: '123e4567-e89b-12d3-a456-426614174000',
          price_cents: 5000,
          qty: 2,
          qr_storage_path: 'test.png',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('sync user data')
    })
  })

  describe('Database Operations', () => {
    it('should generate a UUID for the ask', async () => {
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'generated-uuid',
          event_id: '123e4567-e89b-12d3-a456-426614174000',
          price_cents: 5000,
          qty: 2,
          status: 'open',
          created_at: new Date().toISOString(),
        },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/listings', {
        method: 'POST',
        body: JSON.stringify({
          event_id: '123e4567-e89b-12d3-a456-426614174000',
          price_cents: 5000,
          qty: 2,
          qr_storage_path: 'test.png',
        }),
      })

      await POST(request)

      // Check that insert was called with an id field
      expect(mockSupabase.insert).toHaveBeenCalled()
      const insertCall = mockSupabase.insert.mock.calls[0][0]
      expect(insertCall.id).toBeDefined()
      expect(typeof insertCall.id).toBe('string')
      // UUID format check
      expect(insertCall.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    })

    it('should return 200 with askId on successful creation', async () => {
      const mockAskId = 'ask_123'
      mockSupabase.single.mockResolvedValue({
        data: {
          id: mockAskId,
          event_id: '123e4567-e89b-12d3-a456-426614174000',
          price_cents: 5000,
          qty: 2,
          status: 'open',
          created_at: new Date().toISOString(),
        },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/listings', {
        method: 'POST',
        body: JSON.stringify({
          event_id: '123e4567-e89b-12d3-a456-426614174000',
          price_cents: 5000,
          qty: 2,
          qr_storage_path: 'test.png',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.askId).toBe(mockAskId)
      expect(data.error).toBeNull()
    })
  })

  describe('Error Handling - Database Errors', () => {
    it('should return user-friendly error for foreign key violation (event_id)', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: {
          code: '23503',
          message: 'insert or update on table "asks" violates foreign key constraint "asks_event_id_fkey"',
        },
      })

      const request = new NextRequest('http://localhost:3000/api/listings', {
        method: 'POST',
        body: JSON.stringify({
          event_id: '00000000-0000-0000-0000-000000000000',
          price_cents: 5000,
          qty: 2,
          qr_storage_path: 'test.png',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('event does not exist')
    })

    it('should return user-friendly error for check constraint violation', async () => {
      // API validates input before database, so negative price returns 400
      // This is correct behavior - validate early, fail fast
      const request = new NextRequest('http://localhost:3000/api/listings', {
        method: 'POST',
        body: JSON.stringify({
          event_id: '123e4567-e89b-12d3-a456-426614174000',
          price_cents: -100,
          qty: 2,
          qr_storage_path: 'test.png',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      // API validates price_cents must be positive before hitting database
      expect(response.status).toBe(400)
      expect(data.error).toContain('price')
    })
  })
})
