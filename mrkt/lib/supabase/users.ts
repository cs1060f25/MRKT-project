/**
 * User Management Utilities
 *
 * Helper functions for managing user records in Supabase.
 * Syncs Clerk authentication with Supabase users table.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface UserData {
  id: string
  email: string
  full_name?: string
}

/**
 * Ensure user exists in the database
 *
 * Creates or updates a user record based on Clerk authentication data.
 * This is necessary because Clerk handles authentication but we need
 * user records in Supabase for foreign key relationships.
 *
 * @param supabase - Supabase client (should be service role client)
 * @param userId - Clerk user ID (e.g., "user_xxxxx")
 * @param email - User's email from Clerk
 * @param fullName - User's full name from Clerk (optional)
 * @returns The user record
 * @throws Error if database operation fails
 */
export async function ensureUserExists(
  supabase: SupabaseClient,
  userId: string,
  email: string,
  fullName?: string
): Promise<UserData> {
  if (!userId || !email) {
    throw new Error('userId and email are required')
  }

  try {
    // Upsert user (insert if doesn't exist, update if exists)
    const { data: user, error } = await supabase
      .from('users')
      .upsert(
        {
          id: userId,
          email,
          full_name: fullName || null,
        },
        {
          onConflict: 'id',
        }
      )
      .select('id, email, full_name')
      .single()

    if (error) {
      console.error('[ensureUserExists] Database error:', error)
      throw new Error(`Failed to create/update user: ${error.message}`)
    }

    if (!user) {
      throw new Error('User upsert returned no data')
    }

    return user as UserData
  } catch (err) {
    console.error('[ensureUserExists] Unexpected error:', err)
    throw err instanceof Error ? err : new Error('Failed to ensure user exists')
  }
}

/**
 * Get user by ID
 *
 * @param supabase - Supabase client
 * @param userId - User ID to fetch
 * @returns User record or null if not found
 */
export async function getUserById(
  supabase: SupabaseClient,
  userId: string
): Promise<UserData | null> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null
      }
      console.error('[getUserById] Database error:', error)
      throw new Error(`Failed to get user: ${error.message}`)
    }

    return user as UserData
  } catch (err) {
    console.error('[getUserById] Unexpected error:', err)
    return null
  }
}
