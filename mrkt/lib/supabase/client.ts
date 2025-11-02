/**
 * Supabase Client for Browser/Client Components
 *
 * This client is used in client components and should be called within
 * React components that run in the browser.
 *
 * Features:
 * - RLS-aware (uses authenticated user's JWT token)
 * - Automatic token refresh
 * - Type-safe database access
 *
 * Usage:
 *   import { createBrowserClient } from '@/lib/supabase/client'
 *
 *   const supabase = createBrowserClient()
 *   const { data } = await supabase.from('events').select('*')
 */

import { createBrowserClient as createClient } from '@supabase/ssr'

export function createBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
