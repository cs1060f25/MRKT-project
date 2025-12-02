/**
 * API Route: Create Event
 *
 * Server-side endpoint for creating new events.
 * Uses Clerk authentication and Supabase service role to bypass RLS.
 *
 * Flow:
 * 1. Verify Clerk authentication
 * 2. Validate and sanitize inputs
 * 3. Ensure user exists in database (upsert from Clerk data)
 * 4. Insert event into database
 * 5. Return event ID
 */

import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/server/serviceClient'
import { ensureUserExists } from '@/lib/supabase/users'
import { validateEventForm } from '@/lib/events/validation'

/**
 * Map Postgres error codes to user-friendly messages
 */
function mapDatabaseError(error: any): string {
  const code = error.code || error.error_code

  switch (code) {
    case '23514': // check_constraint_violation
      return 'Data validation failed. Please check your inputs.'

    case '23505': // unique_violation
      return 'An event with this title already exists.'

    case '23502': // not_null_violation
      return 'Missing required data. Please fill out all fields.'

    default:
      return error.message || 'Failed to create event. Please try again.'
  }
}

export async function POST(request: NextRequest) {
  try {
    // ========================================================================
    // 1. Verify Authentication
    // ========================================================================
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to create an event.' },
        { status: 401 }
      )
    }

    // ========================================================================
    // 2. Parse and Validate Request Body
    // ========================================================================
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid request format. Expected JSON.' },
        { status: 400 }
      )
    }

    // Validate using Zod schema
    const validationResult = validateEventForm(body)
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }))
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      )
    }

    const { title, org, startsAt, endsAt } = validationResult.data

    // ========================================================================
    // 3. Get Clerk User Data and Ensure User Exists in Database
    // ========================================================================
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json(
        { error: 'Unable to fetch user data from Clerk' },
        { status: 500 }
      )
    }

    const userEmail = clerkUser.emailAddresses[0]?.emailAddress
    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found. Please update your profile.' },
        { status: 400 }
      )
    }

    const userName = [clerkUser.firstName, clerkUser.lastName]
      .filter(Boolean)
      .join(' ') || undefined

    // Get service role client (bypasses RLS)
    const supabase = getServiceClient({ functionName: 'create-event-api' })

    // Ensure user exists in database
    try {
      await ensureUserExists(supabase, userId, userEmail, userName)
    } catch (userError) {
      console.error('[API] Failed to ensure user exists:', userError)
      return NextResponse.json(
        { error: 'Failed to sync user data. Please try again.' },
        { status: 500 }
      )
    }

    // ========================================================================
    // 4. Generate UUID and Insert Event into Database
    // ========================================================================
    const eventId = crypto.randomUUID()

    const { data: event, error: insertError } = await supabase
      .from('events')
      .insert({
        id: eventId,
        title,
        org,
        starts_at: startsAt,
        ends_at: endsAt,
        created_by: userId,
      })
      .select('id, title, org, starts_at, ends_at, created_by, created_at')
      .single()

    if (insertError) {
      console.error('[API] Database error creating event:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
      })

      const userFriendlyError = mapDatabaseError(insertError)
      return NextResponse.json(
        { error: userFriendlyError },
        { status: 500 }
      )
    }

    if (!event) {
      console.error('[API] Event insert returned no data')
      return NextResponse.json(
        { error: 'Event created but unable to retrieve details' },
        { status: 500 }
      )
    }

    // ========================================================================
    // 5. Return Success Response
    // ========================================================================
    console.log(`[API] Successfully created event ${event.id} for user ${userId}`)

    return NextResponse.json({
      eventId: event.id,
      error: null,
      event: {
        id: event.id,
        title: event.title,
        org: event.org,
        startsAt: event.starts_at,
        endsAt: event.ends_at,
        createdBy: event.created_by,
        createdAt: event.created_at,
      },
    })
  } catch (err) {
    console.error('[API] Unexpected error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
