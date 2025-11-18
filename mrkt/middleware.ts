/**
 * Middleware Configuration
 *
 * This middleware handles Clerk authentication sessions across all routes.
 * It ensures that:
 * - User sessions are properly managed on Vercel
 * - Protected routes require authentication
 * - API routes have access to auth context
 */

import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware()

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
