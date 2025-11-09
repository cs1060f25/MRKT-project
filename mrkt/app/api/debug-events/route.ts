/**
 * Debug API Route to Check Events
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(cookieStore)

    // Check auth status
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    // Query all events without filtering
    const { data: allEvents, error: allError } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })

    // Query upcoming events (with filter)
    const now = new Date().toISOString()
    const { data: upcomingEvents, error: upcomingError } = await supabase
      .from('events')
      .select('*')
      .gt('starts_at', now)
      .order('starts_at', { ascending: true })

    return NextResponse.json({
      success: true,
      now,
      auth: {
        user: user ? { id: user.id, email: user.email } : null,
        error: authError,
      },
      allEvents: {
        count: allEvents?.length || 0,
        data: allEvents,
        error: allError,
      },
      upcomingEvents: {
        count: upcomingEvents?.length || 0,
        data: upcomingEvents,
        error: upcomingError,
      },
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
    })
  }
}
