/**
 * Supabase Client for Next.js Middleware
 *
 * This client is used in middleware.ts to refresh user sessions
 * before requests reach your pages or API routes.
 *
 * Features:
 * - Automatic token refresh
 * - Cookie-based session management
 * - Runs before page/API route execution
 *
 * Usage in middleware.ts:
 *   import { createMiddlewareClient } from '@/lib/supabase/middleware'
 *
 *   export async function middleware(req: NextRequest) {
 *     const res = NextResponse.next()
 *     const supabase = createMiddlewareClient(req, res)
 *     await supabase.auth.getSession()
 *     return res
 *   }
 */

import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export function createMiddlewareClient(
  request: NextRequest,
  response: NextResponse,
  token?: string
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
      // Inject Clerk JWT for RLS policies via auth.jwt()->>'sub'
      global: token
        ? {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        : undefined,
    }
  )
}
