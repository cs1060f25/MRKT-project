/**
 * Validation Schemas for Buy Flow
 *
 * Zod schemas for validating bid creation form data.
 */

import { z } from 'zod'

/**
 * Schema for creating a new bid
 *
 * Validates:
 * - eventId: must be a valid UUID
 * - priceInDollars: must be positive number
 * - quantity: must be positive integer
 */
export const createBidSchema = z.object({
  eventId: z
    .string()
    .min(1, 'Event ID is required')
    .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Invalid event ID'),

  priceInDollars: z
    .number({ message: 'Price must be a number' })
    .positive('Price must be greater than 0')
    .max(10000, 'Price cannot exceed $10,000')
    .multipleOf(0.01, 'Price can have at most 2 decimal places'),

  quantity: z
    .number({ message: 'Quantity must be a number' })
    .int('Quantity must be a whole number')
    .positive('Quantity must be greater than 0')
    .max(100, 'Quantity cannot exceed 100 tickets'),
})

/**
 * Type inference from schema
 */
export type CreateBidFormData = z.infer<typeof createBidSchema>

/**
 * Validate bid form data
 *
 * @param data - Form data to validate
 * @returns Validation result with success flag and errors
 */
export function validateBidForm(data: unknown) {
  return createBidSchema.safeParse(data)
}
