/**
 * Supabase Provider
 *
 * This provider wraps the application and provides access to the Supabase client
 * throughout the component tree.
 *
 * Features:
 * - RLS-aware (uses authenticated user's JWT)
 * - Automatic session management
 * - Works with Clerk authentication
 *
 * Usage in layout.tsx:
 *   import { SupabaseProvider } from '@/providers/supabase-provider'
 *
 *   <SupabaseProvider>
 *     {children}
 *   </SupabaseProvider>
 *
 * Usage in components:
 *   import { useSupabase } from '@/providers/supabase-provider'
 *
 *   const supabase = useSupabase()
 *   const { data } = await supabase.from('events').select('*')
 */

'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@clerk/nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'

type SupabaseContext = {
  supabase: SupabaseClient | null
}

const Context = createContext<SupabaseContext | undefined>(undefined)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const { getToken, userId } = useAuth()
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)

  useEffect(() => {
    // Create Supabase client
    const client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    setSupabase(client)

    // Sync Clerk session with Supabase
    const syncSession = async () => {
      if (userId) {
        // Get Clerk JWT token with Supabase claims
        const token = await getToken({ template: 'supabase' })

        if (token) {
          // Set the Supabase session using Clerk's JWT
          await client.auth.setSession({
            access_token: token,
            refresh_token: '', // Clerk manages refresh
          })
        }
      } else {
        // User signed out, clear Supabase session
        await client.auth.signOut()
      }
    }

    syncSession()
  }, [getToken, userId])

  return (
    <Context.Provider value={{ supabase }}>
      {children}
    </Context.Provider>
  )
}

export function useSupabase() {
  const context = useContext(Context)

  if (context === undefined) {
    throw new Error('useSupabase must be used inside SupabaseProvider')
  }

  return context.supabase
}
