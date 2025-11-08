/**
 * Authentication Test Page
 *
 * This page verifies that Clerk + Supabase authentication is working correctly.
 * Use this to debug "Authentication required" errors.
 *
 * Navigate to: http://localhost:3000/test-auth
 */

'use client'

import { useAuth } from '@clerk/nextjs'
import { useSupabase } from '@/providers/supabase-provider'
import { useState } from 'react'

export default function TestAuthPage() {
  const { userId, isSignedIn, getToken } = useAuth()
  const supabase = useSupabase()

  const [clerkToken, setClerkToken] = useState<string | null>(null)
  const [decodedToken, setDecodedToken] = useState<any>(null)
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runTests = async () => {
    setError(null)
    setTestResult(null)

    try {
      // Test 1: Get Clerk JWT
      const token = await getToken({ template: 'supabase' })
      setClerkToken(token)

      if (!token) {
        setError('❌ Failed to get Clerk JWT token')
        return
      }

      // Test 2: Decode JWT
      const payload = JSON.parse(atob(token.split('.')[1]))
      setDecodedToken(payload)

      // Test 3: Get Supabase user ID
      if (!supabase) {
        setError('❌ Supabase client not initialized')
        return
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError) {
        setError(`❌ Failed to get Supabase user: ${userError.message}`)
        return
      }

      setSupabaseUserId(user?.id || null)

      // Test 4: Call current_user_id() function
      const { data: currentUserId, error: funcError } = await supabase.rpc('current_user_id')

      if (funcError) {
        setError(`❌ current_user_id() failed: ${funcError.message}`)
        return
      }

      // Test 5: Verify RLS is working
      const { data: usersData, error: rlsError } = await supabase
        .from('users')
        .select('*')

      if (rlsError) {
        setError(`❌ RLS test failed: ${rlsError.message}`)
        return
      }

      // All tests passed
      setTestResult(`
✅ All tests passed!

Clerk User ID: ${userId}
JWT sub claim: ${payload.sub}
Supabase user ID: ${user?.id}
current_user_id(): ${currentUserId}
RLS filtering: ${usersData?.length || 0} users visible (should be 0 or 1)

Authentication is working correctly!
      `)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Authentication Test
          </h1>

          {/* Status */}
          <div className="mb-8 space-y-4">
            <div className="flex items-center space-x-3">
              <span className={`text-2xl ${isSignedIn ? 'text-green-500' : 'text-red-500'}`}>
                {isSignedIn ? '✅' : '❌'}
              </span>
              <div>
                <p className="font-medium">Clerk Authentication</p>
                <p className="text-sm text-gray-500">
                  {isSignedIn ? `Signed in as ${userId}` : 'Not signed in'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span className={`text-2xl ${supabase ? 'text-green-500' : 'text-red-500'}`}>
                {supabase ? '✅' : '❌'}
              </span>
              <div>
                <p className="font-medium">Supabase Client</p>
                <p className="text-sm text-gray-500">
                  {supabase ? 'Client initialized' : 'Client not initialized'}
                </p>
              </div>
            </div>
          </div>

          {/* Test Button */}
          <button
            onClick={runTests}
            disabled={!isSignedIn || !supabase}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            Run Authentication Tests
          </button>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <h3 className="text-lg font-medium text-red-900 mb-2">Error</h3>
              <pre className="text-sm text-red-700 whitespace-pre-wrap">{error}</pre>
            </div>
          )}

          {/* Success Display */}
          {testResult && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
              <h3 className="text-lg font-medium text-green-900 mb-2">Test Results</h3>
              <pre className="text-sm text-green-700 whitespace-pre-wrap">{testResult}</pre>
            </div>
          )}

          {/* JWT Token Display */}
          {clerkToken && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Clerk JWT Token</h3>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                {clerkToken}
              </pre>
            </div>
          )}

          {/* Decoded Token */}
          {decodedToken && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Decoded Token Payload</h3>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-60">
                {JSON.stringify(decodedToken, null, 2)}
              </pre>
              <div className="mt-4 space-y-2">
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-sm font-medium text-blue-900">Key Claims:</p>
                  <ul className="mt-2 text-sm text-blue-800 space-y-1">
                    <li><strong>sub:</strong> {decodedToken.sub} (becomes auth.uid())</li>
                    <li><strong>role:</strong> {decodedToken.role}</li>
                    <li><strong>exp:</strong> {new Date(decodedToken.exp * 1000).toLocaleString()}</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Troubleshooting Guide */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Troubleshooting</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div>
                <p className="font-medium text-gray-900">❌ "Not signed in"</p>
                <p>→ Sign in with Clerk first</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">❌ "Client not initialized"</p>
                <p>→ Check that SupabaseProvider wraps your app in layout.tsx</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">❌ "Failed to get Clerk JWT token"</p>
                <p>→ Verify JWT template named 'supabase' exists in Clerk dashboard</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">❌ "current_user_id() failed"</p>
                <p>→ Run migrations: <code className="bg-gray-100 px-1">supabase db reset</code></p>
              </div>
              <div>
                <p className="font-medium text-gray-900">❌ "Authentication required" in RPC calls</p>
                <p>→ You're using createBrowserClient() instead of useSupabase() hook</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
