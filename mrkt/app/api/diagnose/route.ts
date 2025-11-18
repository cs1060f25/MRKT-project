/**
 * Diagnostic API Route
 *
 * Tests Supabase connection and shows environment status
 */

import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const diagnostics: Record<string, any> = {
      timestamp: new Date().toISOString(),
      env_vars: {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing',
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing',
        CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ? '✅ Set' : '❌ Missing',
      },
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET',
    }

    // Try to connect to Supabase
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        )

        // Try a simple query
        const { data, error } = await supabase
          .from('events')
          .select('count')
          .limit(1)

        if (error) {
          diagnostics.supabase_connection = `❌ Error: ${error.message}`
          diagnostics.error_details = error
        } else {
          diagnostics.supabase_connection = '✅ Connected successfully'
          diagnostics.events_table = '✅ Accessible'
        }
      } catch (err: any) {
        diagnostics.supabase_connection = `❌ Connection failed: ${err.message}`
        diagnostics.error_stack = err.stack
      }
    } else {
      diagnostics.supabase_connection = '❌ Cannot test - missing env vars'
    }

    return NextResponse.json(diagnostics, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
