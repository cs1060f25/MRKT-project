/**
 * Tests for CreateListingForm Component
 *
 * Tests form rendering, validation, submission, and error handling.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { CreateListingForm } from '@/components/sell/CreateListingForm'
import type { EventOption } from '@/lib/sell/types'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock Supabase browser client
jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn(() => ({})),
}))

// Mock fetch for API calls
const mockFetch = jest.fn()
global.fetch = mockFetch

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

    // Default successful fetch responses
    mockFetch.mockImplementation((url: string) => {
      if (url === '/api/listings') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ askId: 'new-ask-id', error: null }),
        })
      }
      if (url.includes('/upload-qr')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, path: 'test/path' }),
        })
      }
      return Promise.reject(new Error('Unknown URL'))
    })
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
      const form = priceInput.closest('form')!

      fireEvent.change(priceInput, { target: { value: '50' } })
      fireEvent.change(quantityInput, { target: { value: '2' } })
      fireEvent.submit(form)

      // Check for error message in red text paragraphs
      await waitFor(() => {
        const redErrorTexts = document.querySelectorAll('.text-red-400')
        expect(redErrorTexts.length).toBeGreaterThan(0)
      })
    })

    it('should show validation error for invalid price', async () => {
      render(<CreateListingForm events={mockEvents} />)

      const eventSelect = screen.getByLabelText(/event/i)
      const priceInput = screen.getByLabelText(/floor price/i)
      const quantityInput = screen.getByLabelText(/quantity/i)
      const form = priceInput.closest('form')!

      fireEvent.change(eventSelect, { target: { value: mockEvents[0].id } })
      fireEvent.change(priceInput, { target: { value: '-10' } })
      fireEvent.change(quantityInput, { target: { value: '2' } })
      fireEvent.submit(form)

      await waitFor(() => {
        const redErrorTexts = document.querySelectorAll('.text-red-400')
        expect(redErrorTexts.length).toBeGreaterThan(0)
      })
    })

    it('should show validation error for price exceeding maximum', async () => {
      render(<CreateListingForm events={mockEvents} />)

      const eventSelect = screen.getByLabelText(/event/i)
      const priceInput = screen.getByLabelText(/floor price/i)
      const quantityInput = screen.getByLabelText(/quantity/i)
      const form = priceInput.closest('form')!

      fireEvent.change(eventSelect, { target: { value: mockEvents[0].id } })
      fireEvent.change(priceInput, { target: { value: '15000' } })
      fireEvent.change(quantityInput, { target: { value: '2' } })
      fireEvent.submit(form)

      await waitFor(() => {
        const redErrorTexts = document.querySelectorAll('.text-red-400')
        expect(redErrorTexts.length).toBeGreaterThan(0)
      })
    })

    it('should show validation error for invalid quantity', async () => {
      render(<CreateListingForm events={mockEvents} />)

      const eventSelect = screen.getByLabelText(/event/i)
      const priceInput = screen.getByLabelText(/floor price/i)
      const quantityInput = screen.getByLabelText(/quantity/i)
      const form = priceInput.closest('form')!

      fireEvent.change(eventSelect, { target: { value: mockEvents[0].id } })
      fireEvent.change(priceInput, { target: { value: '50' } })
      fireEvent.change(quantityInput, { target: { value: '0' } })
      fireEvent.submit(form)

      await waitFor(() => {
        const redErrorTexts = document.querySelectorAll('.text-red-400')
        expect(redErrorTexts.length).toBeGreaterThan(0)
      })
    })

    it('should show validation error when QR file is not selected', async () => {
      render(<CreateListingForm events={mockEvents} />)

      const eventSelect = screen.getByLabelText(/event/i)
      const priceInput = screen.getByLabelText(/floor price/i)
      const quantityInput = screen.getByLabelText(/quantity/i)
      const form = priceInput.closest('form')!

      fireEvent.change(eventSelect, { target: { value: mockEvents[0].id } })
      fireEvent.change(priceInput, { target: { value: '50' } })
      fireEvent.change(quantityInput, { target: { value: '2' } })
      fireEvent.submit(form)

      await waitFor(() => {
        const redErrorTexts = document.querySelectorAll('.text-red-400')
        expect(redErrorTexts.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Form Submission', () => {
    // Helper to simulate file selection
    const selectQRFile = async () => {
      const fileInput = screen.getByLabelText(/qr code image/i)
      const mockFile = new File(['test'], 'test.png', { type: 'image/png' })

      // Mock arrayBuffer for the file
      Object.defineProperty(mockFile, 'arrayBuffer', {
        value: () => Promise.resolve(new ArrayBuffer(8)),
      })

      fireEvent.change(fileInput, { target: { files: [mockFile] } })

      // Wait for file to be processed
      await waitFor(() => {}, { timeout: 100 })
    }

    it('should successfully submit valid form data', async () => {
      render(<CreateListingForm events={mockEvents} />)

      const eventSelect = screen.getByLabelText(/event/i)
      const priceInput = screen.getByLabelText(/floor price/i)
      const quantityInput = screen.getByLabelText(/quantity/i)
      const submitButton = screen.getByRole('button', { name: /create listing/i })

      fireEvent.change(eventSelect, { target: { value: mockEvents[0].id } })
      fireEvent.change(priceInput, { target: { value: '50.00' } })
      fireEvent.change(quantityInput, { target: { value: '2' } })

      await selectQRFile()

      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/listings', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }))
      })

      // Verify the body contains correct data
      const fetchCall = mockFetch.mock.calls.find((call: unknown[]) => call[0] === '/api/listings')
      const body = JSON.parse(fetchCall[1].body)
      expect(body.event_id).toBe(mockEvents[0].id)
      expect(body.price_cents).toBe(5000) // $50.00 converted to cents
      expect(body.qty).toBe(2)

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
      render(<CreateListingForm events={mockEvents} />)

      const eventSelect = screen.getByLabelText(/event/i)
      const priceInput = screen.getByLabelText(/floor price/i)
      const quantityInput = screen.getByLabelText(/quantity/i)
      const submitButton = screen.getByRole('button', { name: /create listing/i })

      fireEvent.change(eventSelect, { target: { value: mockEvents[0].id } })
      fireEvent.change(priceInput, { target: { value: '99.99' } })
      fireEvent.change(quantityInput, { target: { value: '1' } })

      await selectQRFile()

      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/listings', expect.anything())
      })

      const fetchCall = mockFetch.mock.calls.find((call: unknown[]) => call[0] === '/api/listings')
      const body = JSON.parse(fetchCall[1].body)
      expect(body.price_cents).toBe(9999) // $99.99 converted to cents
    })

    it('should handle submission errors', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url === '/api/listings') {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: 'Failed to create listing' }),
          })
        }
        return Promise.reject(new Error('Unknown URL'))
      })

      render(<CreateListingForm events={mockEvents} />)

      const eventSelect = screen.getByLabelText(/event/i)
      const priceInput = screen.getByLabelText(/floor price/i)
      const quantityInput = screen.getByLabelText(/quantity/i)
      const submitButton = screen.getByRole('button', { name: /create listing/i })

      fireEvent.change(eventSelect, { target: { value: mockEvents[0].id } })
      fireEvent.change(priceInput, { target: { value: '50' } })
      fireEvent.change(quantityInput, { target: { value: '2' } })

      await selectQRFile()

      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/failed to create listing/i)).toBeInTheDocument()
      })

      // Should NOT redirect on error
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should disable form while submitting', async () => {
      mockFetch.mockImplementation((url: string) => {
        return new Promise((resolve) =>
          setTimeout(() => {
            if (url === '/api/listings') {
              resolve({
                ok: true,
                json: () => Promise.resolve({ askId: 'new-ask-id', error: null }),
              })
            } else {
              resolve({
                ok: true,
                json: () => Promise.resolve({ success: true }),
              })
            }
          }, 100)
        )
      })

      render(<CreateListingForm events={mockEvents} />)

      const eventSelect = screen.getByLabelText(/event/i)
      const priceInput = screen.getByLabelText(/floor price/i)
      const quantityInput = screen.getByLabelText(/quantity/i)
      const submitButton = screen.getByRole('button', { name: /create listing/i })

      fireEvent.change(eventSelect, { target: { value: mockEvents[0].id } })
      fireEvent.change(priceInput, { target: { value: '50' } })
      fireEvent.change(quantityInput, { target: { value: '2' } })

      await selectQRFile()

      fireEvent.click(submitButton)

      // Should show submitting state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /creating listing/i })).toBeDisabled()
      })

      // Wait for submission to complete
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled()
      })
    })
  })

  describe('UI Interactions', () => {
    it('should display error banner when API returns error', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url === '/api/listings') {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: 'Network error' }),
          })
        }
        return Promise.reject(new Error('Unknown URL'))
      })

      render(<CreateListingForm events={mockEvents} />)

      const eventSelect = screen.getByLabelText(/event/i)
      const priceInput = screen.getByLabelText(/floor price/i)
      const quantityInput = screen.getByLabelText(/quantity/i)
      const submitButton = screen.getByRole('button', { name: /create listing/i })

      // Select QR file first
      const fileInput = screen.getByLabelText(/qr code image/i)
      const mockFile = new File(['test'], 'test.png', { type: 'image/png' })
      Object.defineProperty(mockFile, 'arrayBuffer', {
        value: () => Promise.resolve(new ArrayBuffer(8)),
      })
      fireEvent.change(fileInput, { target: { files: [mockFile] } })
      await waitFor(() => {}, { timeout: 100 })

      fireEvent.change(eventSelect, { target: { value: mockEvents[0].id } })
      fireEvent.change(priceInput, { target: { value: '50' } })
      fireEvent.change(quantityInput, { target: { value: '2' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })

      // Error banner should be visible
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
