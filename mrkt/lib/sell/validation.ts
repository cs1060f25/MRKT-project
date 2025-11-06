/**
 * Validation Schemas for Sell Flow
 *
 * Zod schemas for validating listing creation form data.
 */

import { z } from 'zod'

/**
 * Schema for creating a new listing
 *
 * Validates:
 * - eventId: must be a valid UUID
 * - priceInDollars: must be positive number
 * - quantity: must be positive integer
 */
export const createListingSchema = z.object({
  eventId: z
    .string()
    .uuid('Please select a valid event')
    .min(1, 'Event is required'),

  priceInDollars: z
    .number({
      required_error: 'Price is required',
      invalid_type_error: 'Price must be a number',
    })
    .positive('Price must be greater than 0')
    .max(10000, 'Price cannot exceed $10,000')
    .multipleOf(0.01, 'Price can have at most 2 decimal places'),

  quantity: z
    .number({
      required_error: 'Quantity is required',
      invalid_type_error: 'Quantity must be a number',
    })
    .int('Quantity must be a whole number')
    .positive('Quantity must be greater than 0')
    .max(100, 'Quantity cannot exceed 100 tickets'),
})

/**
 * Type inference from schema
 */
export type CreateListingFormData = z.infer<typeof createListingSchema>

/**
 * Validate form data
 *
 * @param data - Form data to validate
 * @returns Validation result with success flag and errors
 */
export function validateListingForm(data: unknown) {
  return createListingSchema.safeParse(data)
}
