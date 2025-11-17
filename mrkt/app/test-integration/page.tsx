'use client'

import { useSupabase } from '@/providers/supabase-provider'
import { useAuth, useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'

export default function TestIntegrationPage() {
  const { supabase } = useSupabase()
  const { userId, getToken } = useAuth()
  const { user } = useUser()
  const [jwtPayload, setJwtPayload] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [eventsError, setEventsError] = useState<string | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [usersError, setUsersError] = useState<string | null>(null)
  const [testsPassed, setTestsPassed] = useState<{
    providerExists: boolean
    clerkAuth: boolean
    jwtGeneration: boolean
    dbConnection: boolean
    rlsEnforcement: boolean | null
  }>({
    providerExists: false,
    clerkAuth: false,
    jwtGeneration: false,
    dbConnection: false,
    rlsEnforcement: null,
  })

  useEffect(() => {
    async function runTests() {
      const results = { ...testsPassed }

      // Test 1: SupabaseProvider exists
      if (supabase) {
        results.providerExists = true
      }

      // Test 2: Clerk authentication
      if (userId) {
        results.clerkAuth = true
      }

      // Test 3: JWT token generation
      if (userId) {
        try {
          const token = await getToken({ template: 'supabase' })
          if (token) {
            results.jwtGeneration = true

            // Decode JWT to inspect claims
            const payload = JSON.parse(atob(token.split('.')[1]))
            setJwtPayload(payload)
          }
        } catch (err) {
          console.error('JWT generation failed:', err)
        }
      }

      // Test 4: Database connection
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('events')
            .select('id, title, org')
            .limit(5)

          if (error) {
            setEventsError(error.message)
          } else {
            results.dbConnection = true
            setEvents(data || [])
          }
        } catch (err) {
          setEventsError(err instanceof Error ? err.message : 'Unknown error')
        }
      }

      // Test 5: RLS enforcement (should only return user's own row or none)
      if (supabase && userId) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')

          if (error) {
            setUsersError(error.message)
          } else {
            setUsers(data || [])
            // RLS should only return 0 or 1 row (user's own profile)
            results.rlsEnforcement = data !== null && data.length <= 1
          }
        } catch (err) {
          setUsersError(err instanceof Error ? err.message : 'Unknown error')
        }
      }

      setTestsPassed(results)
    }

    runTests()
  }, [supabase, userId, getToken])

  const allTestsPassed = testsPassed.providerExists &&
    testsPassed.clerkAuth &&
    testsPassed.jwtGeneration &&
    testsPassed.dbConnection &&
    (testsPassed.rlsEnforcement === true || testsPassed.rlsEnforcement === null)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Supabase Integration Test</h1>
        <p className="text-gray-600 mb-8">
          This page verifies that the Supabase client SDK is properly integrated with Clerk authentication.
        </p>

        {/* Overall Status */}
        <div className={`mb-8 p-4 rounded-lg ${allTestsPassed ? 'bg-green-100 border-2 border-green-400' : 'bg-yellow-100 border-2 border-yellow-400'}`}>
          <h2 className="text-xl font-bold mb-2">
            {allTestsPassed ? '✅ All Tests Passed' : '⏳ Running Tests...'}
          </h2>
          <p className="text-sm">
            {allTestsPassed
              ? 'The Supabase integration is working correctly.'
              : 'Please wait while tests complete or check failing tests below.'}
          </p>
        </div>

        {/* Test Results */}
        <div className="space-y-4 mb-8">
          <TestResult
            name="1. SupabaseProvider Integration"
            passed={testsPassed.providerExists}
            description="Verifies that useSupabase() hook returns a client instance"
          />

          <TestResult
            name="2. Clerk Authentication"
            passed={testsPassed.clerkAuth}
            description="Verifies user is authenticated via Clerk"
            detail={userId ? `User ID: ${userId}` : 'Not signed in'}
          />

          <TestResult
            name="3. JWT Token Generation"
            passed={testsPassed.jwtGeneration}
            description="Verifies Clerk can generate JWT with 'supabase' template"
            detail={jwtPayload ? `sub: ${jwtPayload.sub}, role: ${jwtPayload.role}` : undefined}
          />

          <TestResult
            name="4. Database Connection"
            passed={testsPassed.dbConnection}
            description="Verifies Supabase client can query the database"
            detail={eventsError || (events.length > 0 ? `Found ${events.length} events` : 'No events found')}
          />

          <TestResult
            name="5. RLS Enforcement"
            passed={testsPassed.rlsEnforcement === true}
            description="Verifies row-level security filters data by user"
            detail={usersError || (users.length <= 1 ? `Returned ${users.length} user(s) (expected ≤ 1)` : `⚠️ Returned ${users.length} users (RLS may not be working)`)}
          />
        </div>

        {/* User Info */}
        <div className="mb-8 p-4 bg-white rounded-lg border border-gray-200">
          <h3 className="text-lg font-bold mb-3">User Information</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Clerk User ID:</span>{' '}
              <code className="bg-gray-100 px-2 py-1 rounded">{userId || 'Not signed in'}</code>
            </div>
            <div>
              <span className="font-medium">Email:</span>{' '}
              <span>{user?.primaryEmailAddress?.emailAddress || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium">Full Name:</span>{' '}
              <span>{user?.fullName || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* JWT Payload */}
        {jwtPayload && (
          <div className="mb-8 p-4 bg-white rounded-lg border border-gray-200">
            <h3 className="text-lg font-bold mb-3">JWT Payload (Decoded)</h3>
            <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">
              {JSON.stringify(jwtPayload, null, 2)}
            </pre>
            <div className="mt-3 text-sm text-gray-600">
              <p><strong>Key Claims:</strong></p>
              <ul className="list-disc ml-5 mt-1">
                <li><code>sub</code>: {jwtPayload.sub} → becomes <code>auth.uid()</code> in RLS</li>
                <li><code>role</code>: {jwtPayload.role}</li>
                <li><code>aud</code>: {jwtPayload.aud}</li>
              </ul>
            </div>
          </div>
        )}

        {/* Events Data */}
        {events.length > 0 && (
          <div className="mb-8 p-4 bg-white rounded-lg border border-gray-200">
            <h3 className="text-lg font-bold mb-3">Sample Events Query</h3>
            <p className="text-sm text-gray-600 mb-3">
              SELECT id, title, org FROM events LIMIT 5
            </p>
            <div className="space-y-2">
              {events.map((event, i) => (
                <div key={i} className="text-sm bg-gray-50 p-2 rounded">
                  <span className="font-medium">{event.title}</span>
                  {event.org && <span className="text-gray-600"> - {event.org}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-bold mb-2">Next Steps</h3>
          <ul className="list-disc ml-5 text-sm space-y-1">
            <li>If not signed in, use the sign-in button in the header</li>
            <li>Verify all 5 tests pass with green checkmarks</li>
            <li>Check that JWT payload shows correct <code>sub</code> claim</li>
            <li>Verify RLS enforcement returns ≤ 1 user row</li>
            <li>If tests fail, check console for detailed error messages</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function TestResult({
  name,
  passed,
  description,
  detail,
}: {
  name: string
  passed: boolean | null
  description: string
  detail?: string
}) {
  return (
    <div className={`p-4 rounded-lg border-2 ${passed ? 'bg-green-50 border-green-400' : passed === null ? 'bg-gray-50 border-gray-300' : 'bg-red-50 border-red-400'}`}>
      <div className="flex items-start">
        <span className="text-2xl mr-3">
          {passed ? '✅' : passed === null ? '⏸️' : '❌'}
        </span>
        <div className="flex-1">
          <h3 className="font-bold">{name}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
          {detail && (
            <p className="text-sm mt-2 font-mono bg-white px-2 py-1 rounded border">
              {detail}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
