/**
 * Tests for BidForm Component
 *
 * Tests form rendering, validation, submission, and error handling.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BidForm } from '@/components/buy/BidForm'

// Mock Supabase browser client
jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn(() => ({})),
}))

// Mock useSupabase provider
jest.mock('@/providers/supabase-provider', () => ({
  useSupabase: jest.fn(() => ({
    supabase: {},
    isReady: true,
    supabaseUserId: 'test-supabase-user-id',
    refreshSession: jest.fn(),
  })),
}))

// Mock fetch for API calls
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('BidForm', () => {
  const mockEventId = '123e4567-e89b-12d3-a456-426614174000'
  const mockOnSuccess = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    // Default successful fetch response
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, bid: { id: 'new-bid-id' } }),
    })
  })

  describe('Rendering', () => {
    it('should render all form fields', () => {
      render(<BidForm eventId={mockEventId} />)

      expect(screen.getByLabelText(/max price/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /place bid/i })).toBeInTheDocument()
    })

    it('should have correct input attributes', () => {
      render(<BidForm eventId={mockEventId} />)

      const priceInput = screen.getByLabelText(/max price/i)
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
    it('should show validation error for invalid price', async () => {
      render(<BidForm eventId={mockEventId} />)

      const priceInput = screen.getByLabelText(/max price/i)
      const quantityInput = screen.getByLabelText(/quantity/i)
      const form = priceInput.closest('form')!

      fireEvent.change(priceInput, { target: { value: '-10' } })
      fireEvent.change(quantityInput, { target: { value: '2' } })
      fireEvent.submit(form)

      // Check for error message in red text paragraphs
      await waitFor(() => {
        const redErrorTexts = document.querySelectorAll('.text-red-400')
        expect(redErrorTexts.length).toBeGreaterThan(0)
      })
    })

    it('should show validation error for price exceeding maximum', async () => {
      render(<BidForm eventId={mockEventId} />)

      const priceInput = screen.getByLabelText(/max price/i)
      const quantityInput = screen.getByLabelText(/quantity/i)
      const form = priceInput.closest('form')!

      fireEvent.change(priceInput, { target: { value: '15000' } })
      fireEvent.change(quantityInput, { target: { value: '2' } })
      fireEvent.submit(form)

      await waitFor(() => {
        const redErrorTexts = document.querySelectorAll('.text-red-400')
        expect(redErrorTexts.length).toBeGreaterThan(0)
      })
    })

    it('should show validation error for invalid quantity', async () => {
      render(<BidForm eventId={mockEventId} />)

      const priceInput = screen.getByLabelText(/max price/i)
      const quantityInput = screen.getByLabelText(/quantity/i)
      const form = priceInput.closest('form')!

      fireEvent.change(priceInput, { target: { value: '50' } })
      fireEvent.change(quantityInput, { target: { value: '0' } })
      fireEvent.submit(form)

      await waitFor(() => {
        const redErrorTexts = document.querySelectorAll('.text-red-400')
        expect(redErrorTexts.length).toBeGreaterThan(0)
      })
    })

    it('should show validation error for quantity exceeding maximum', async () => {
      render(<BidForm eventId={mockEventId} />)

      const priceInput = screen.getByLabelText(/max price/i)
      const quantityInput = screen.getByLabelText(/quantity/i)
      const form = priceInput.closest('form')!

      fireEvent.change(priceInput, { target: { value: '50' } })
      fireEvent.change(quantityInput, { target: { value: '150' } })
      fireEvent.submit(form)

      await waitFor(() => {
        const redErrorTexts = document.querySelectorAll('.text-red-400')
        expect(redErrorTexts.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Form Submission', () => {
    it('should successfully submit valid form data', async () => {
      render(<BidForm eventId={mockEventId} onSuccess={mockOnSuccess} />)

      const priceInput = screen.getByLabelText(/max price/i)
      const quantityInput = screen.getByLabelText(/quantity/i)
      const submitButton = screen.getByRole('button', { name: /place bid/i })

      fireEvent.change(priceInput, { target: { value: '50.00' } })
      fireEvent.change(quantityInput, { target: { value: '2' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/bids/create', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }))
      })

      // Verify the body contains correct data
      const fetchCall = mockFetch.mock.calls.find((call: unknown[]) => call[0] === '/api/bids/create')
      const body = JSON.parse(fetchCall[1].body)
      expect(body.eventId).toBe(mockEventId)
      expect(body.priceCents).toBe(5000) // $50.00 converted to cents
      expect(body.qty).toBe(2)

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/bid placed!/i)).toBeInTheDocument()
      })

      // Should call onSuccess callback
      expect(mockOnSuccess).toHaveBeenCalled()
    })

    it('should convert price to cents correctly', async () => {
      render(<BidForm eventId={mockEventId} />)

      const priceInput = screen.getByLabelText(/max price/i)
      const quantityInput = screen.getByLabelText(/quantity/i)
      const submitButton = screen.getByRole('button', { name: /place bid/i })

      fireEvent.change(priceInput, { target: { value: '99.99' } })
      fireEvent.change(quantityInput, { target: { value: '1' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/bids/create', expect.anything())
      })

      const fetchCall = mockFetch.mock.calls.find((call: unknown[]) => call[0] === '/api/bids/create')
      const body = JSON.parse(fetchCall[1].body)
      expect(body.priceCents).toBe(9999) // $99.99 converted to cents
    })

    it('should handle submission errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to create bid' }),
      })

      render(<BidForm eventId={mockEventId} onSuccess={mockOnSuccess} />)

      const priceInput = screen.getByLabelText(/max price/i)
      const quantityInput = screen.getByLabelText(/quantity/i)
      const submitButton = screen.getByRole('button', { name: /place bid/i })

      fireEvent.change(priceInput, { target: { value: '50' } })
      fireEvent.change(quantityInput, { target: { value: '2' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/failed to create bid/i)).toBeInTheDocument()
      })

      // Should NOT call onSuccess on error
      expect(mockOnSuccess).not.toHaveBeenCalled()
    })

    it('should disable form while submitting', async () => {
      mockFetch.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, bid: { id: 'id' } }),
        }), 100))
      )

      render(<BidForm eventId={mockEventId} />)

      const priceInput = screen.getByLabelText(/max price/i)
      const quantityInput = screen.getByLabelText(/quantity/i)
      const submitButton = screen.getByRole('button', { name: /place bid/i })

      fireEvent.change(priceInput, { target: { value: '50' } })
      fireEvent.change(quantityInput, { target: { value: '2' } })
      fireEvent.click(submitButton)

      // Should show submitting state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /placing bid/i })).toBeDisabled()
      })

      // Wait for submission to complete
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled()
      })
    })

    it('should clear form after successful submission', async () => {
      render(<BidForm eventId={mockEventId} />)

      const priceInput = screen.getByLabelText(/max price/i) as HTMLInputElement
      const quantityInput = screen.getByLabelText(/quantity/i) as HTMLInputElement
      const submitButton = screen.getByRole('button', { name: /place bid/i })

      fireEvent.change(priceInput, { target: { value: '50' } })
      fireEvent.change(quantityInput, { target: { value: '2' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/bid placed!/i)).toBeInTheDocument()
      })

      // Form should be cleared
      await waitFor(() => {
        expect(priceInput.value).toBe('')
        expect(quantityInput.value).toBe('')
      })
    })
  })

  describe('UI Interactions', () => {
    it('should clear errors when retry button is clicked', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Network error' }),
      })

      render(<BidForm eventId={mockEventId} />)

      const priceInput = screen.getByLabelText(/max price/i)
      const quantityInput = screen.getByLabelText(/quantity/i)
      const submitButton = screen.getByRole('button', { name: /place bid/i })

      fireEvent.change(priceInput, { target: { value: '50' } })
      fireEvent.change(quantityInput, { target: { value: '2' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /try again/i })
      fireEvent.click(retryButton)

      await waitFor(() => {
        expect(screen.queryByText(/network error/i)).not.toBeInTheDocument()
      })
    })

    it('should update input values correctly', () => {
      render(<BidForm eventId={mockEventId} />)

      const priceInput = screen.getByLabelText(/max price/i) as HTMLInputElement
      const quantityInput = screen.getByLabelText(/quantity/i) as HTMLInputElement

      fireEvent.change(priceInput, { target: { value: '75.50' } })
      fireEvent.change(quantityInput, { target: { value: '3' } })

      expect(priceInput.value).toBe('75.50')
      expect(quantityInput.value).toBe('3')
    })
  })
})
