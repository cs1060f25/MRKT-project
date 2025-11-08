/**
 * Supabase Client for Browser/Client Components
 *
 * ⚠️ WARNING: DO NOT USE THIS DIRECTLY IN COMPONENTS!
 *
 * This function creates a NEW Supabase client WITHOUT authentication.
 * Using it directly will cause "Authentication required" errors.
 *
 * ✅ CORRECT USAGE - Use the authenticated client from SupabaseProvider:
 * ```typescript
 * import { useSupabase } from '@/providers/supabase-provider'
 *
 * function MyComponent() {
 *   const supabase = useSupabase()  // ✅ Authenticated with Clerk JWT
 *   const { data } = await supabase.from('events').select('*')
 * }
 * ```
 *
 * ❌ INCORRECT USAGE - Do NOT create new clients:
 * ```typescript
 * import { createBrowserClient } from '@/lib/supabase/client'
 *
 * function MyComponent() {
 *   const supabase = createBrowserClient()  // ❌ No auth session!
 *   // This will fail with "Authentication required"
 * }
 * ```
 *
 * This function should ONLY be used by SupabaseProvider to create
 * the authenticated client instance that gets shared across the app.
 */

import { createBrowserClient as createClient } from '@supabase/ssr'

export function createBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
