/**
 * Supabase Clients for Server-Side Rendering
 *
 * These clients are used in server components, route handlers, and server actions.
 * They handle cookie-based session management for SSR.
 *
 * Features:
 * - SSR-safe with cookie handling
 * - RLS-aware (uses authenticated user's JWT)
 * - Automatic token refresh via cookies
 *
 * Usage in Server Components:
 *   import { createServerClient } from '@/lib/supabase/server'
 *   import { cookies } from 'next/headers'
 *
 *   const cookieStore = await cookies()
 *   const supabase = createServerClient(cookieStore)
 *
 * Usage in Route Handlers:
 *   import { createRouteHandlerClient } from '@/lib/supabase/server'
 *   import { cookies } from 'next/headers'
 *
 *   const cookieStore = await cookies()
 *   const supabase = createRouteHandlerClient(cookieStore)
 */

import { createServerClient as createClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

/**
 * Create a Supabase client for Server Components
 *
 * This client handles cookies in a read-only manner, suitable for
 * React Server Components which cannot modify cookies.
 */
export function createServerClient(cookieStore: ReadonlyRequestCookies) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Create a Supabase client for Route Handlers
 *
 * This client can both read and write cookies, making it suitable
 * for API routes and route handlers.
 */
export function createRouteHandlerClient(cookieStore: ReadonlyRequestCookies) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}

/**
 * Create a Supabase client for Server Actions
 *
 * Server Actions can modify cookies, so this client handles both
 * reading and writing cookies.
 */
export async function createServerActionClient() {
  const cookieStore = await cookies()

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
