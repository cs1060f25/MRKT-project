import { z } from 'zod';

// Auth validation
export const loginSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .refine(
      (email) => email.endsWith('@hbs.edu'),
      'Only @hbs.edu email addresses are allowed'
    ),
});

export const verifyTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

// Event validation
export const eventCreateSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters'),

  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be less than 2000 characters'),

  clubName: z
    .string()
    .min(2, 'Club name must be at least 2 characters')
    .max(100, 'Club name must be less than 100 characters'),

  eventDateTime: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val))
    .refine((date) => date > new Date(), 'Event date must be in the future'),

  venue: z
    .string()
    .min(3, 'Venue must be at least 3 characters')
    .max(200, 'Venue must be less than 200 characters'),

  retailPrice: z
    .number()
    .positive('Retail price must be positive')
    .max(10000, 'Retail price must be less than $10,000')
    .or(z.string().transform((val) => parseFloat(val)))
    .refine((val) => !isNaN(val) && val > 0, 'Invalid retail price'),

  maxResaleCap: z
    .number()
    .min(100, 'Max resale cap must be at least 100%')
    .max(500, 'Max resale cap must be less than 500%')
    .nullable()
    .optional()
    .or(
      z
        .string()
        .transform((val) => (val === '' ? null : parseFloat(val)))
        .nullable()
    ),

  ticketFormat: z.enum(['QR_CODE', 'EVENTBRITE_LINK'], {
    errorMap: () => ({ message: 'Please select a valid ticket format' }),
  }),

  listingOpenTime: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val)),

  listingCloseTime: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val)),

  resalesEnabled: z.boolean().default(true),
}).refine(
  (data) => data.listingCloseTime > data.listingOpenTime,
  {
    message: 'Listing close time must be after listing open time',
    path: ['listingCloseTime'],
  }
).refine(
  (data) => data.listingCloseTime <= data.eventDateTime,
  {
    message: 'Listing close time must be before or at event date/time',
    path: ['listingCloseTime'],
  }
);

export const eventUpdateSchema = eventCreateSchema.partial().extend({
  id: z.string().cuid(),
});

export const eventIdSchema = z.object({
  id: z.string().cuid('Invalid event ID'),
});

// Listing validation
export const listingCreateSchema = z.object({
  eventId: z.string().cuid('Invalid event ID'),
  price: z
    .number()
    .positive('Price must be positive')
    .max(10000, 'Price must be less than $10,000'),
});

export const listingUpdateSchema = z.object({
  id: z.string().cuid('Invalid listing ID'),
  price: z.number().positive('Price must be positive').optional(),
  status: z.enum(['ACTIVE', 'SOLD', 'CANCELLED']).optional(),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyTokenInput = z.infer<typeof verifyTokenSchema>;
export type EventCreateInput = z.infer<typeof eventCreateSchema>;
export type EventUpdateInput = z.infer<typeof eventUpdateSchema>;
export type ListingCreateInput = z.infer<typeof listingCreateSchema>;
export type ListingUpdateInput = z.infer<typeof listingUpdateSchema>;
