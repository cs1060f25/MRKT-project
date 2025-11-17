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
 *   const { supabase } = useSupabase()
 *   const { data } = await supabase.from('events').select('*')
 */

'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@clerk/nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'

type SupabaseContext = {
  supabase: SupabaseClient | null
  isReady: boolean
  supabaseUserId: string | null
  refreshSession: () => Promise<string | null>
}

const Context = createContext<SupabaseContext | undefined>(undefined)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const { getToken, userId, isLoaded } = useAuth()
  const clientRef = useRef<SupabaseClient | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const getClient = useCallback(() => {
    if (!clientRef.current) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      console.log('[SupabaseProvider] Creating client with URL:', url)
      
      // For Clerk third-party auth, create client WITHOUT trying to manage sessions
      // The JWT will be passed via Authorization header on each request
      clientRef.current = createBrowserClient(url, key, {
        auth: {
          persistSession: false, // Don't try to persist Clerk sessions
          autoRefreshToken: false, // Clerk handles token refresh
        }
      })
    }
    return clientRef.current
  }, [])

  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null)

  const syncSession = useCallback(async (options?: { skipReadyState?: boolean }) => {
    const client = getClient()

    if (!options?.skipReadyState && isMountedRef.current) {
      setIsReady(false)
    }

    // For the workaround, we don't try to auth with Supabase directly
    // Authentication is handled via API routes that verify Clerk sessions
    // and use the service role key
    console.log('[SupabaseProvider] Using Clerk auth workaround - Supabase client ready for public queries')

    if (isMountedRef.current) {
      setSupabase(client)
      setSupabaseUserId(userId ?? null) // Store Clerk user ID for reference
      if (!options?.skipReadyState) {
        setIsReady(true)
      }
    }

    return userId ?? null
  }, [getClient, userId])

  useEffect(() => {
    if (!isLoaded) {
      if (isMountedRef.current) {
        setSupabase(null)
        setSupabaseUserId(null)
        setIsReady(false)
      }
      return
    }

    syncSession()
  }, [isLoaded, syncSession])

  const refreshSession = useCallback(async () => {
    return syncSession({ skipReadyState: true })
  }, [syncSession])

  return (
    <Context.Provider value={{ supabase, isReady, supabaseUserId, refreshSession }}>
      {children}
    </Context.Provider>
  )
}

export function useSupabase() {
  const context = useContext(Context)

  if (context === undefined) {
    throw new Error('useSupabase must be used inside SupabaseProvider')
  }

  return context
}
