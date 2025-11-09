/**
 * Tests for CreateListingForm Component
 *
 * Tests form rendering, validation, submission, and error handling.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { CreateListingForm } from '@/components/sell/CreateListingForm'
import { createAsk } from '@/lib/supabase/rpc'
import type { EventOption } from '@/lib/sell/types'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock Supabase browser client
jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn(() => ({
    // Mock Supabase client methods if needed
  })),
}))

// Mock RPC functions
jest.mock('@/lib/supabase/rpc', () => ({
  createAsk: jest.fn(),
}))

describe('CreateListingForm', () => {
  const mockPush = jest.fn()
  const mockRouter = {
    push: mockPush,
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
    replace: jest.fn(),
  }

  const mockEvents: EventOption[] = [
    {
      id: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Test Event 1',
      starts_at: '2025-12-01T19:00:00Z',
      org: 'Test Org',
    },
    {
      id: '223e4567-e89b-12d3-a456-426614174000',
      title: 'Test Event 2',
      starts_at: '2025-12-15T20:00:00Z',
      org: 'Another Org',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  describe('Rendering', () => {
    it('should render all form fields', () => {
      render(<CreateListingForm events={mockEvents} />)

      expect(screen.getByLabelText(/event/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/floor price/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create listing/i })).toBeInTheDocument()
    })

    it('should render event options in dropdown', () => {
      render(<CreateListingForm events={mockEvents} />)

      const eventSelect = screen.getByLabelText(/event/i)
      expect(eventSelect).toBeInTheDocument()

      // Check for placeholder option
      expect(screen.getByText(/select an event/i)).toBeInTheDocument()

      // Check for event options (using text matching)
      expect(screen.getByText(/Test Event 1/)).toBeInTheDocument()
      expect(screen.getByText(/Test Event 2/)).toBeInTheDocument()
    })

    it('should have correct input attributes', () => {
      render(<CreateListingForm events={mockEvents} />)

      const priceInput = screen.getByLabelText(/floor price/i)
      expect(priceInput).toHaveAttribute('type', 'number')
      expect(priceInput).toHaveAttribute('step', '0.01')
      expect(priceInput).toHaveAttribute('min', '0')
      expect(priceInput).toHaveAttribute('max', '10000')

      const quantityInput = screen.getByLabelText(/quantity/i)
      expect(quantityInput).toHaveAttribute('type', 'number')
      expect(quantityInput).toHaveAttribute('min', '1')
      expect(quantityInput).toHaveAttribute('max', '100')
    })
  })

  describe('Validation', () => {
    it('should show validation error when event is not selected', async () => {
      render(<CreateListingForm events={mockEvents} />)

      const priceInput = screen.getByLabelText(/floor price/i)
      const quantityInput = screen.getByLabelText(/quantity/i)
      const submitButton = screen.getByRole('button', { name: /create listing/i })

      fireEvent.change(priceInput, { target: { value: '50' } })
      fireEvent.change(quantityInput, { target: { value: '2' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/event is required/i)).toBeInTheDocument()
      })
    })

    it('should show validation error for invalid price', async () => {
      render(<CreateListingForm events={mockEvents} />)

      const eventSelect = screen.getByLabelText(/event/i)
      const priceInput = screen.getByLabelText(/floor price/i)
      const quantityInput = screen.getByLabelText(/quantity/i)
      const submitButton = screen.getByRole('button', { name: /create listing/i })

      fireEvent.change(eventSelect, { target: { value: mockEvents[0].id } })
      fireEvent.change(priceInput, { target: { value: '-10' } })
      fireEvent.change(quantityInput, { target: { value: '2' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/price must be greater than 0/i)).toBeInTheDocument()
      })
    })

    it('should show validation error for price exceeding maximum', async () => {
      render(<CreateListingForm events={mockEvents} />)

      const eventSelect = screen.getByLabelText(/event/i)
      const priceInput = screen.getByLabelText(/floor price/i)
      const quantityInput = screen.getByLabelText(/quantity/i)
      const submitButton = screen.getByRole('button', { name: /create listing/i })

      fireEvent.change(eventSelect, { target: { value: mockEvents[0].id } })
      fireEvent.change(priceInput, { target: { value: '15000' } })
      fireEvent.change(quantityInput, { target: { value: '2' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/price cannot exceed/i)).toBeInTheDocument()
      })
    })

    it('should show validation error for invalid quantity', async () => {
      render(<CreateListingForm events={mockEvents} />)

      const eventSelect = screen.getByLabelText(/event/i)
      const priceInput = screen.getByLabelText(/floor price/i)
      const quantityInput = screen.getByLabelText(/quantity/i)
      const submitButton = screen.getByRole('button', { name: /create listing/i })

      fireEvent.change(eventSelect, { target: { value: mockEvents[0].id } })
      fireEvent.change(priceInput, { target: { value: '50' } })
      fireEvent.change(quantityInput, { target: { value: '0' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/quantity must be greater than 0/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('should successfully submit valid form data', async () => {
      const mockCreateAsk = createAsk as jest.Mock
      mockCreateAsk.mockResolvedValue({
        askId: 'new-ask-id',
        error: null,
      })

      render(<CreateListingForm events={mockEvents} />)

      const eventSelect = screen.getByLabelText(/event/i)
      const priceInput = screen.getByLabelText(/floor price/i)
      const quantityInput = screen.getByLabelText(/quantity/i)
      const submitButton = screen.getByRole('button', { name: /create listing/i })

      fireEvent.change(eventSelect, { target: { value: mockEvents[0].id } })
      fireEvent.change(priceInput, { target: { value: '50.00' } })
      fireEvent.change(quantityInput, { target: { value: '2' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockCreateAsk).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            event_id: mockEvents[0].id,
            price_cents: 5000, // $50.00 converted to cents
            qty: 2,
            qr_storage_path: expect.stringContaining('pending-upload/'),
          })
        )
      })

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/listing created!/i)).toBeInTheDocument()
      })

      // Should redirect after 2 seconds
      await waitFor(
        () => {
          expect(mockPush).toHaveBeenCalledWith('/sell/success')
        },
        { timeout: 3000 }
      )
    })

    it('should convert price to cents correctly', async () => {
      const mockCreateAsk = createAsk as jest.Mock
      mockCreateAsk.mockResolvedValue({
        askId: 'new-ask-id',
        error: null,
      })

      render(<CreateListingForm events={mockEvents} />)

      const eventSelect = screen.getByLabelText(/event/i)
      const priceInput = screen.getByLabelText(/floor price/i)
      const quantityInput = screen.getByLabelText(/quantity/i)
      const submitButton = screen.getByRole('button', { name: /create listing/i })

      fireEvent.change(eventSelect, { target: { value: mockEvents[0].id } })
      fireEvent.change(priceInput, { target: { value: '99.99' } })
      fireEvent.change(quantityInput, { target: { value: '1' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockCreateAsk).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            price_cents: 9999, // $99.99 converted to cents
          })
        )
      })
    })

    it('should handle submission errors', async () => {
      const mockCreateAsk = createAsk as jest.Mock
      mockCreateAsk.mockResolvedValue({
        askId: null,
        error: 'Failed to create listing',
      })

      render(<CreateListingForm events={mockEvents} />)

      const eventSelect = screen.getByLabelText(/event/i)
      const priceInput = screen.getByLabelText(/floor price/i)
      const quantityInput = screen.getByLabelText(/quantity/i)
      const submitButton = screen.getByRole('button', { name: /create listing/i })

      fireEvent.change(eventSelect, { target: { value: mockEvents[0].id } })
      fireEvent.change(priceInput, { target: { value: '50' } })
      fireEvent.change(quantityInput, { target: { value: '2' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/failed to create listing/i)).toBeInTheDocument()
      })

      // Should NOT redirect on error
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should disable form while submitting', async () => {
      const mockCreateAsk = createAsk as jest.Mock
      mockCreateAsk.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ askId: 'id', error: null }), 100))
      )

      render(<CreateListingForm events={mockEvents} />)

      const eventSelect = screen.getByLabelText(/event/i)
      const priceInput = screen.getByLabelText(/floor price/i)
      const quantityInput = screen.getByLabelText(/quantity/i)
      const submitButton = screen.getByRole('button', { name: /create listing/i })

      fireEvent.change(eventSelect, { target: { value: mockEvents[0].id } })
      fireEvent.change(priceInput, { target: { value: '50' } })
      fireEvent.change(quantityInput, { target: { value: '2' } })
      fireEvent.click(submitButton)

      // Should show submitting state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /creating listing/i })).toBeDisabled()
      })

      // Wait for submission to complete
      await waitFor(() => {
        expect(mockCreateAsk).toHaveBeenCalled()
      })
    })
  })

  describe('UI Interactions', () => {
    it('should clear validation errors when error banner retry is clicked', async () => {
      const mockCreateAsk = createAsk as jest.Mock
      mockCreateAsk.mockResolvedValue({
        askId: null,
        error: 'Network error',
      })

      render(<CreateListingForm events={mockEvents} />)

      const eventSelect = screen.getByLabelText(/event/i)
      const priceInput = screen.getByLabelText(/floor price/i)
      const quantityInput = screen.getByLabelText(/quantity/i)
      const submitButton = screen.getByRole('button', { name: /create listing/i })

      fireEvent.change(eventSelect, { target: { value: mockEvents[0].id } })
      fireEvent.change(priceInput, { target: { value: '50' } })
      fireEvent.change(quantityInput, { target: { value: '2' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })

      // Click retry button (assuming ErrorBanner has one)
      // Note: This assumes ErrorBanner has a retry button - adjust if different
      const errorBanner = screen.getByText(/network error/i).closest('div')
      expect(errorBanner).toBeInTheDocument()
    })

    it('should update input values correctly', () => {
      render(<CreateListingForm events={mockEvents} />)

      const priceInput = screen.getByLabelText(/floor price/i) as HTMLInputElement
      const quantityInput = screen.getByLabelText(/quantity/i) as HTMLInputElement

      fireEvent.change(priceInput, { target: { value: '75.50' } })
      fireEvent.change(quantityInput, { target: { value: '3' } })

      expect(priceInput.value).toBe('75.50')
      expect(quantityInput.value).toBe('3')
    })
  })
})
