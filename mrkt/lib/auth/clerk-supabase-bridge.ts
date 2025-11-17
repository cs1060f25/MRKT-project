/**
 * Clerk + Supabase Bridge
 * 
 * Workaround for Supabase Cloud's broken Clerk RS256 JWT integration.
 * 
 * This module provides server-side authentication that:
 * 1. Verifies Clerk authentication on the server
 * 2. Uses Supabase service role key to bypass RLS
 * 3. Manually enforces RLS-like rules based on Clerk user ID
 */

import { auth } from '@clerk/nextjs/server'
import { getServiceClient } from '@/lib/supabase/server'

/**
 * Get authenticated Supabase client for current Clerk user
 * 
 * This creates a service role client but tracks the Clerk user ID
 * so we can manually enforce RLS-like permissions
 */
export async function getAuthenticatedSupabaseClient() {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized: No Clerk session')
  }

  // Get service role client (bypasses RLS)
  const supabase = getServiceClient({
    functionName: 'clerk-auth-bridge',
    traceId: `clerk-${userId}`
  })

  return {
    supabase,
    userId, // Clerk user ID to use for manual RLS enforcement
  }
}

/**
 * Ensure user exists in Supabase users table
 * 
 * Creates user record if it doesn't exist
 */
export async function ensureUserExists(userId: string, email?: string, fullName?: string) {
  const supabase = getServiceClient({
    functionName: 'ensure-user',
    traceId: userId
  })

  // Check if user exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single()

  if (existingUser) {
    return existingUser
  }

  // Create user if doesn't exist
  const { data: newUser, error} = await supabase
    .from('users')
    .insert({
      id: userId,
      email: email || `${userId}@clerk.user`,
      full_name: fullName || 'User',
    })
    .select()
    .single()

  if (error) {
    console.error('[ensureUserExists] Error creating user:', error)
    throw error
  }

  return newUser
}

