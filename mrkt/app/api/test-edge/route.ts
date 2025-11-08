import { createRouteHandlerClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET() {
  try {
    // Get auth state
    const { userId } = await auth()

    // Create Supabase client for route handler
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(cookieStore)

    // Test 1: Check session
    const { data: { session } } = await supabase.auth.getSession()

    // Test 2: Query events (public read)
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, org')
      .limit(3)

    // Test 3: Query users (RLS-enforced)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username')

    return NextResponse.json({
      success: true,
      runtime: 'edge',
      auth: {
        clerkUserId: userId,
        supabaseUserId: session?.user?.id || null,
        sessionExists: !!session,
        userIdsMatch: session?.user?.id === userId,
      },
      tests: {
        eventsQuery: {
          success: !eventsError,
          error: eventsError?.message || null,
          count: events?.length || 0,
          data: events || [],
        },
        usersQuery: {
          success: !usersError,
          error: usersError?.message || null,
          count: users?.length || 0,
          rlsWorking: users !== null && users.length <= 1,
        },
      },
      message: session
        ? 'Edge middleware successfully synced JWT to API route'
        : 'No session found - user may not be authenticated',
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
