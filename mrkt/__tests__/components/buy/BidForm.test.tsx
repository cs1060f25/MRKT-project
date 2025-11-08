/**
 * Tests for BidForm Component
 *
 * Tests form rendering, validation, submission, and error handling.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BidForm } from '@/components/buy/BidForm'
import { createBid } from '@/lib/supabase/rpc'

// Mock Supabase browser client
jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn(() => ({
    // Mock Supabase client methods if needed
  })),
}))

// Mock RPC functions
jest.mock('@/lib/supabase/rpc', () => ({
  createBid: jest.fn(),
}))

describe('BidForm', () => {
  const mockEventId = '123e4567-e89b-12d3-a456-426614174000'
  const mockOnSuccess = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
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
      const submitButton = screen.getByRole('button', { name: /place bid/i })

      fireEvent.change(priceInput, { target: { value: '-10' } })
      fireEvent.change(quantityInput, { target: { value: '2' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/price must be greater than 0/i)).toBeInTheDocument()
      })
    })

    it('should show validation error for price exceeding maximum', async () => {
      render(<BidForm eventId={mockEventId} />)

      const priceInput = screen.getByLabelText(/max price/i)
      const quantityInput = screen.getByLabelText(/quantity/i)
      const submitButton = screen.getByRole('button', { name: /place bid/i })

      fireEvent.change(priceInput, { target: { value: '15000' } })
      fireEvent.change(quantityInput, { target: { value: '2' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/price cannot exceed/i)).toBeInTheDocument()
      })
    })

    it('should show validation error for invalid quantity', async () => {
      render(<BidForm eventId={mockEventId} />)

      const priceInput = screen.getByLabelText(/max price/i)
      const quantityInput = screen.getByLabelText(/quantity/i)
      const submitButton = screen.getByRole('button', { name: /place bid/i })

      fireEvent.change(priceInput, { target: { value: '50' } })
      fireEvent.change(quantityInput, { target: { value: '0' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/quantity must be greater than 0/i)).toBeInTheDocument()
      })
    })

    it('should show validation error for quantity exceeding maximum', async () => {
      render(<BidForm eventId={mockEventId} />)

      const priceInput = screen.getByLabelText(/max price/i)
      const quantityInput = screen.getByLabelText(/quantity/i)
      const submitButton = screen.getByRole('button', { name: /place bid/i })

      fireEvent.change(priceInput, { target: { value: '50' } })
      fireEvent.change(quantityInput, { target: { value: '150' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/quantity cannot exceed 100/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('should successfully submit valid form data', async () => {
      const mockCreateBid = createBid as jest.Mock
      mockCreateBid.mockResolvedValue({
        bidId: 'new-bid-id',
        error: null,
      })

      render(<BidForm eventId={mockEventId} onSuccess={mockOnSuccess} />)

      const priceInput = screen.getByLabelText(/max price/i)
      const quantityInput = screen.getByLabelText(/quantity/i)
      const submitButton = screen.getByRole('button', { name: /place bid/i })

      fireEvent.change(priceInput, { target: { value: '50.00' } })
      fireEvent.change(quantityInput, { target: { value: '2' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockCreateBid).toHaveBeenCalledWith(
          expect.anything(),
          mockEventId,
          5000, // $50.00 converted to cents
          2
        )
      })

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/bid placed!/i)).toBeInTheDocument()
      })

      // Should call onSuccess callback
      expect(mockOnSuccess).toHaveBeenCalled()
    })

    it('should convert price to cents correctly', async () => {
      const mockCreateBid = createBid as jest.Mock
      mockCreateBid.mockResolvedValue({
        bidId: 'new-bid-id',
        error: null,
      })

      render(<BidForm eventId={mockEventId} />)

      const priceInput = screen.getByLabelText(/max price/i)
      const quantityInput = screen.getByLabelText(/quantity/i)
      const submitButton = screen.getByRole('button', { name: /place bid/i })

      fireEvent.change(priceInput, { target: { value: '99.99' } })
      fireEvent.change(quantityInput, { target: { value: '1' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockCreateBid).toHaveBeenCalledWith(
          expect.anything(),
          mockEventId,
          9999, // $99.99 converted to cents
          1
        )
      })
    })

    it('should handle submission errors', async () => {
      const mockCreateBid = createBid as jest.Mock
      mockCreateBid.mockResolvedValue({
        bidId: null,
        error: 'Failed to create bid',
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
      const mockCreateBid = createBid as jest.Mock
      mockCreateBid.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ bidId: 'id', error: null }), 100))
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
        expect(mockCreateBid).toHaveBeenCalled()
      })
    })

    it('should clear form after successful submission', async () => {
      const mockCreateBid = createBid as jest.Mock
      mockCreateBid.mockResolvedValue({
        bidId: 'new-bid-id',
        error: null,
      })

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
      const mockCreateBid = createBid as jest.Mock
      mockCreateBid.mockResolvedValue({
        bidId: null,
        error: 'Network error',
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
