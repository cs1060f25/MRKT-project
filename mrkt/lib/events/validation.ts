/**
 * Validation Schemas for Event Creation Flow
 *
 * Zod schemas for validating event creation form data.
 */

import { z } from 'zod'

/**
 * Schema for creating a new event
 *
 * Validates:
 * - title: required, non-empty string
 * - org: required, non-empty string (organization name)
 * - startsAt: required, must be in the future
 * - endsAt: required, must be after startsAt
 */
export const createEventSchema = z
  .object({
    title: z
      .string({
        required_error: 'Event title is required',
      })
      .min(1, 'Event title is required')
      .max(200, 'Event title cannot exceed 200 characters'),

    org: z
      .string({
        required_error: 'Organization is required',
      })
      .min(1, 'Organization is required')
      .max(100, 'Organization name cannot exceed 100 characters'),

    startsAt: z
      .string({
        required_error: 'Start date/time is required',
      })
      .min(1, 'Start date/time is required')
      .refine(
        (val) => {
          const date = new Date(val)
          return !isNaN(date.getTime())
        },
        { message: 'Invalid start date/time format' }
      )
      .refine(
        (val) => {
          const date = new Date(val)
          return date > new Date()
        },
        { message: 'Start date must be in the future' }
      ),

    endsAt: z
      .string({
        required_error: 'End date/time is required',
      })
      .min(1, 'End date/time is required')
      .refine(
        (val) => {
          const date = new Date(val)
          return !isNaN(date.getTime())
        },
        { message: 'Invalid end date/time format' }
      ),
  })
  .refine(
    (data) => {
      const start = new Date(data.startsAt)
      const end = new Date(data.endsAt)
      return end > start
    },
    {
      message: 'End date must be after start date',
      path: ['endsAt'],
    }
  )

/**
 * Type inference from schema
 */
export type CreateEventFormData = z.infer<typeof createEventSchema>

/**
 * Validate form data
 *
 * @param data - Form data to validate
 * @returns Validation result with success flag and errors
 */
export function validateEventForm(data: unknown) {
  return createEventSchema.safeParse(data)
}

/**
 * Get field-specific errors from Zod validation result
 *
 * @param result - Zod safeParse result
 * @returns Object with field names as keys and error messages as values
 */
export function getFieldErrors(
  result: ReturnType<typeof validateEventForm>
): Record<string, string> {
  if (result.success) {
    return {}
  }

  const errors: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const path = issue.path[0]
    if (typeof path === 'string' && !errors[path]) {
      errors[path] = issue.message
    }
  }
  return errors
}
