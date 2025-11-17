/**
 * Get Current User API Route
 * 
 * Returns the authenticated user's information from both Clerk and Supabase
 */

import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getAuthenticatedSupabaseClient, ensureUserExists } from '@/lib/auth/clerk-supabase-bridge'

export async function GET() {
  try {
    // Get Clerk user
    const clerkUser = await currentUser()
    
    if (!clerkUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Ensure user exists in Supabase
    const { supabase, userId } = await getAuthenticatedSupabaseClient()
    
    await ensureUserExists(
      userId,
      clerkUser.emailAddresses[0]?.emailAddress,
      `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim()
    )

    // Get user from Supabase
    const { data: supabaseUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('[/api/auth/me] Error fetching user:', error)
      return NextResponse.json(
        { error: 'Failed to fetch user' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      clerk: {
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
      },
      supabase: supabaseUser,
      authenticated: true,
    })
  } catch (error: any) {
    console.error('[/api/auth/me] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

