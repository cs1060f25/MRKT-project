import { createServerClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { cookies, headers } from 'next/headers'

export default async function TestEdgePage() {
  // Get auth state
  const { userId } = await auth()

  // Create Supabase client for server component
  const cookieStore = await cookies()
  const supabase = createServerClient(cookieStore)
  const hdrs = await headers()
  const protocol = hdrs.get('x-forwarded-proto') ?? 'http'
  const host = hdrs.get('host') ?? 'localhost:3000'
  const baseUrl = `${protocol}://${host}`

  // Test 1: Basic query (events table - public read)
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, title, org')
    .limit(5)

  // Test 2: RLS-enforced query (users table - should only return own profile)
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')

  // Test 3: Check current session
  const { data: { session } } = await supabase.auth.getSession()

  // Helper to call our API with the current user's cookies
  async function postCreateBid(payload: unknown) {
    const res = await fetch(`${baseUrl}/api/bids/create`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        // Pass through cookies so Clerk auth is available to the API route
        cookie: cookieStore.toString(),
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
    let body: any = null
    try {
      body = await res.json()
    } catch {
      body = null
    }
    return { status: res.status, body }
  }

  // Prepare a valid baseline payload using a known event
  const knownEventId =
    (events && events.length > 0 && events[0]?.id) ||
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  const validBase = {
    eventId: knownEventId,
    priceCents: 5000,
    qty: 1,
    buyerId: userId || 'anonymous',
  }

  // Only run validation tests if signed in (API requires auth)
  const invalidEventId = userId
    ? await postCreateBid({ ...validBase, eventId: 'not-a-uuid' })
    : null
  const nonIntegerPrice = userId
    ? await postCreateBid({ ...validBase, priceCents: 123.45 })
    : null
  const priceTooHigh = userId
    ? await postCreateBid({ ...validBase, priceCents: 1_000_001 })
    : null
  const qtyZero = userId
    ? await postCreateBid({ ...validBase, qty: 0 })
    : null
  const qtyTooHigh = userId
    ? await postCreateBid({ ...validBase, qty: 101 })
    : null
  const buyerMismatch = userId
    ? await postCreateBid({ ...validBase, buyerId: `${userId}-mismatch` })
    : null
  const eventNotFound = userId
    ? await postCreateBid({
        ...validBase,
        eventId: '00000000-0000-0000-0000-000000000000',
      })
    : null

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Edge Middleware Test (Server Component)</h1>
        <p className="text-gray-600 mb-8">
          This page is a Server Component that tests whether the edge middleware
          successfully syncs Clerk JWT with Supabase sessions.
        </p>

        {/* Authentication Status */}
        <div className="mb-8 p-4 bg-white rounded-lg border border-gray-200">
          <h2 className="text-xl font-bold mb-3">Authentication Status</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">Clerk User ID:</span>
              <code className="bg-gray-100 px-2 py-1 rounded">
                {userId || 'Not authenticated'}
              </code>
              {userId ? (
                <span className="text-green-600">✅</span>
              ) : (
                <span className="text-red-600">❌</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Supabase Session:</span>
              <code className="bg-gray-100 px-2 py-1 rounded">
                {session ? 'Active' : 'None'}
              </code>
              {session ? (
                <span className="text-green-600">✅</span>
              ) : (
                <span className="text-red-600">❌</span>
              )}
            </div>
            {session && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="font-medium mb-1">Session Details:</p>
                <div className="text-xs bg-gray-50 p-2 rounded">
                  <p><strong>User ID (from JWT):</strong> {session.user.id}</p>
                  <p><strong>Match:</strong> {session.user.id === userId ? '✅ Yes' : '❌ No'}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Test Results */}
        <div className="space-y-6">
          {/* Test 1: Events Query */}
          <TestResult
            title="Test 1: Public Events Query"
            description="SELECT id, title, org FROM events LIMIT 5"
            success={!eventsError && events !== null}
            error={eventsError?.message}
          >
            {events && events.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-green-600 font-medium">
                  ✅ Found {events.length} events
                </p>
                {events.map((event, i) => (
                  <div key={i} className="text-sm bg-gray-50 p-2 rounded">
                    <span className="font-medium">{event.title}</span>
                    {event.org && <span className="text-gray-600"> - {event.org}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">No events found</p>
            )}
          </TestResult>

          {/* Test 2: RLS Query */}
          <TestResult
            title="Test 2: RLS-Enforced Users Query"
            description="SELECT * FROM users (should only return your own profile)"
            success={!usersError && users !== null && users.length <= 1}
            error={usersError?.message}
          >
            {users !== null ? (
              <div className="space-y-2">
                <p className={`text-sm font-medium ${users.length <= 1 ? 'text-green-600' : 'text-orange-600'}`}>
                  {users.length <= 1 ? '✅' : '⚠️'} Returned {users.length} user(s)
                  {users.length <= 1 ? ' (RLS working correctly)' : ' (RLS may not be filtering)'}
                </p>
                {users.length > 0 && (
                  <div className="text-xs bg-gray-50 p-2 rounded">
                    <p><strong>User ID:</strong> {users[0].id}</p>
                    <p><strong>Username:</strong> {users[0].username || 'N/A'}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-600">No users found</p>
            )}
          </TestResult>

          {/* Test 3: Session Verification */}
          <TestResult
            title="Test 3: Session Sync Verification"
            description="Verify Clerk user ID matches Supabase session user ID"
            success={session !== null && session.user.id === userId}
            error={!session ? 'No Supabase session found' : undefined}
          >
            {session ? (
              <div className="space-y-2">
                <p className="text-sm text-green-600 font-medium">
                  ✅ Middleware successfully synced session
                </p>
                <div className="text-xs bg-gray-50 p-2 rounded space-y-1">
                  <p><strong>Clerk User ID:</strong> {userId}</p>
                  <p><strong>Supabase User ID:</strong> {session.user.id}</p>
                  <p><strong>Match:</strong> {session.user.id === userId ? '✅ Yes' : '❌ No'}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-red-600">
                ❌ Middleware did not sync session (user may not be authenticated)
              </p>
            )}
          </TestResult>

          {/* Test 4: Create Bid API - Validation Scenarios */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Test 4: Create Bid API Validations</h2>
            {!userId ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-sm">
                Please sign in to run these API validation tests.
              </div>
            ) : (
              <div className="space-y-4">
                <TestResult
                  title="Invalid eventId format"
                  description='POST /api/bids/create with eventId="not-a-uuid"'
                  success={!!invalidEventId && invalidEventId.status === 400}
                  error={invalidEventId?.body?.error}
                />
                <TestResult
                  title="Non-integer priceCents"
                  description="POST /api/bids/create with priceCents=123.45"
                  success={!!nonIntegerPrice && nonIntegerPrice.status === 400}
                  error={nonIntegerPrice?.body?.error}
                />
                <TestResult
                  title="Price exceeds maximum ($10,000)"
                  description="POST /api/bids/create with priceCents=1_000_001"
                  success={!!priceTooHigh && priceTooHigh.status === 400}
                  error={priceTooHigh?.body?.error}
                />
                <TestResult
                  title="Quantity must be positive integer"
                  description="POST /api/bids/create with qty=0"
                  success={!!qtyZero && qtyZero.status === 400}
                  error={qtyZero?.body?.error}
                />
                <TestResult
                  title="Quantity exceeds maximum (100)"
                  description="POST /api/bids/create with qty=101"
                  success={!!qtyTooHigh && qtyTooHigh.status === 400}
                  error={qtyTooHigh?.body?.error}
                />
                <TestResult
                  title="Buyer mismatch forbidden"
                  description="POST /api/bids/create with buyerId != current user"
                  success={!!buyerMismatch && buyerMismatch.status === 403}
                  error={buyerMismatch?.body?.error}
                />
                <TestResult
                  title="Event not found (valid UUID but missing)"
                  description='POST /api/bids/create with eventId="00000000-0000-0000-0000-000000000000"'
                  success={!!eventNotFound && eventNotFound.status === 404}
                  error={eventNotFound?.body?.error}
                />
              </div>
            )}
          </div>
        </div>

        {/* Overall Status */}
        <div className={`mt-8 p-4 rounded-lg border-2 ${
          session && !eventsError && !usersError && users && users.length <= 1
            ? 'bg-green-50 border-green-400'
            : 'bg-orange-50 border-orange-400'
        }`}>
          <h2 className="text-xl font-bold mb-2">
            {session && !eventsError && !usersError && users && users.length <= 1
              ? '✅ All Tests Passed'
              : '⚠️ Some Tests Failed'}
          </h2>
          <p className="text-sm">
            {session && !eventsError && !usersError && users && users.length <= 1
              ? 'Edge middleware is successfully syncing Clerk JWT with Supabase sessions!'
              : 'Check the test results above for details. If you are not signed in, please sign in and refresh.'}
          </p>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-bold mb-2">Testing Notes</h3>
          <ul className="list-disc ml-5 text-sm space-y-1">
            <li>This is a Server Component (runs on the server, not in the browser)</li>
            <li>The middleware should have already synced your Clerk JWT before this page loaded</li>
            <li>If you see ❌, make sure you're signed in via Clerk</li>
            <li>Check the server logs for any middleware errors</li>
            <li>The session should persist across page refreshes</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function TestResult({
  title,
  description,
  success,
  error,
  children,
}: {
  title: string
  description: string
  success: boolean
  error?: string
  children?: React.ReactNode
}) {
  return (
    <div className={`p-4 rounded-lg border-2 ${
      success ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'
    }`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{success ? '✅' : '❌'}</span>
        <div className="flex-1">
          <h3 className="font-bold">{title}</h3>
          <p className="text-sm text-gray-600 mt-1 font-mono">{description}</p>
          {error && (
            <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}
          {children && <div className="mt-3">{children}</div>}
        </div>
      </div>
    </div>
  )
}
