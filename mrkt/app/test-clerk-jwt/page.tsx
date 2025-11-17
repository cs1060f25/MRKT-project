'use client'

import { useAuth } from '@clerk/nextjs'
import { useSupabase } from '@/providers/supabase-provider'
import { useState, useEffect } from 'react'

export default function TestClerkJWTPage() {
  const { getToken, userId, isLoaded, isSignedIn } = useAuth()
  const { supabase, isReady, supabaseUserId } = useSupabase()
  const [jwt, setJwt] = useState<string | null>(null)
  const [decoded, setDecoded] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<any>(null)

  useEffect(() => {
    async function fetchAndTest() {
      if (!isLoaded || !isSignedIn || !supabase) return

      try {
        setError(null)
        
        // Get JWT from Clerk
        const token = await getToken({ template: 'supabase' })
        
        console.log('[Test] Token received:', token ? 'yes' : 'no', 'Type:', typeof token)
        
        if (!token) {
          setError('No JWT token received from Clerk. Check that JWT template "supabase" exists in Clerk dashboard.')
          return
        }
        
        setJwt(token)

        // Decode JWT for inspection (with error handling)
        try {
          const parts = token.split('.')
          console.log('[Test] JWT parts:', parts.length, 'First part length:', parts[0]?.length)
          
          if (parts.length !== 3) {
            throw new Error(`Invalid JWT format: expected 3 parts, got ${parts.length}`)
          }
          
          // JWT uses base64url encoding (not standard base64)
          // We need to convert base64url to base64 before using atob()
          const base64urlToBase64 = (str: string) => {
            // Replace base64url chars with base64 chars
            let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
            // Add padding if needed
            const pad = base64.length % 4
            if (pad) {
              if (pad === 1) {
                throw new Error('Invalid base64url string')
              }
              base64 += '==='.slice(0, 4 - pad)
            }
            return base64
          }
          
          const payload = JSON.parse(atob(base64urlToBase64(parts[1])))
          setDecoded(payload)
          console.log('[Test] JWT decoded successfully:', payload)
        } catch (decodeError: any) {
          console.error('[Test] JWT decode error:', decodeError)
          console.error('[Test] Token preview:', token?.substring(0, 100))
          setError(`Failed to decode JWT: ${decodeError.message}. Check console for token details.`)
          return
        }

        // Test Supabase auth
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          setError(`Supabase auth error: ${authError.message}`)
          return
        }

        // Test RLS with a simple query
        const { data: events, error: queryError } = await supabase
          .from('events')
          .select('*')
          .limit(5)

        setTestResult({
          user,
          eventCount: events?.length || 0,
          queryError: queryError?.message || null
        })

      } catch (err: any) {
        setError(`Test failed: ${err.message}`)
      }
    }

    fetchAndTest()
  }, [isLoaded, isSignedIn, supabase, getToken])

  if (!isLoaded) {
    return <div className="p-8">Loading Clerk...</div>
  }

  if (!isSignedIn) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Test Clerk JWT Integration</h1>
        <p className="text-red-600">Please sign in to test JWT authentication</p>
        <a href="/sign-in" className="text-blue-600 underline">Go to Sign In</a>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Clerk JWT + Supabase Auth Test</h1>

      {/* Status Overview */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">Clerk Status</h2>
          <p>User ID: {userId || 'None'}</p>
          <p>Signed In: {isSignedIn ? '✅ Yes' : '❌ No'}</p>
        </div>
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">Supabase Status</h2>
          <p>Ready: {isReady ? '✅ Yes' : '❌ No'}</p>
          <p>User ID: {supabaseUserId || 'None'}</p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* JWT Token */}
      {jwt && (
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">JWT Token</h2>
          <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-32">
            {jwt}
          </pre>
        </div>
      )}

      {/* Decoded JWT */}
      {decoded && (
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">Decoded JWT Payload</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-64">
            {JSON.stringify(decoded, null, 2)}
          </pre>
          <div className="mt-4 bg-blue-100 border border-blue-400 p-4 rounded">
            <p className="font-bold mb-2">Key Claims for RLS:</p>
            <ul className="list-disc ml-6">
              <li><strong>sub:</strong> {decoded.sub} (becomes auth.uid())</li>
              <li><strong>role:</strong> {decoded.role || 'not set'}</li>
              <li><strong>aud:</strong> {decoded.aud || 'not set'}</li>
              <li><strong>alg (header):</strong> RS256</li>
            </ul>
          </div>
        </div>
      )}

      {/* Test Results */}
      {testResult && (
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">Supabase Test Results</h2>
          {testResult.user ? (
            <div className="bg-green-100 border border-green-400 p-4 rounded">
              <p className="font-bold text-green-800 mb-2">✅ Authentication Successful!</p>
              <p><strong>Supabase User ID:</strong> {testResult.user.id}</p>
              <p><strong>Email:</strong> {testResult.user.email || 'N/A'}</p>
              <p><strong>Events Query:</strong> Found {testResult.eventCount} events</p>
              {testResult.queryError && (
                <p className="text-red-600 mt-2">Query Error: {testResult.queryError}</p>
              )}
            </div>
          ) : (
            <div className="bg-red-100 border border-red-400 p-4 rounded">
              <p className="font-bold text-red-800">❌ Authentication Failed</p>
              <p>Unable to get Supabase user</p>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-yellow-50 border border-yellow-300 p-4 rounded">
        <h2 className="font-bold mb-2">What This Test Checks:</h2>
        <ol className="list-decimal ml-6 space-y-1">
          <li>Clerk provides a JWT token with the "supabase" template</li>
          <li>JWT is signed with RS256 algorithm</li>
          <li>Supabase accepts and verifies the JWT</li>
          <li>auth.uid() in RLS policies equals Clerk user ID</li>
          <li>Database queries work with RLS</li>
        </ol>
      </div>

      {/* Troubleshooting */}
      {error && (
        <div className="bg-red-50 border border-red-300 p-4 rounded mt-4">
          <h2 className="font-bold mb-2">Troubleshooting Steps:</h2>
          <ol className="list-decimal ml-6 space-y-2">
            <li>
              <strong>Verify Clerk JWT Template exists:</strong>
              <ul className="list-disc ml-6 mt-1">
                <li>Go to <a href="https://dashboard.clerk.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Clerk Dashboard</a></li>
                <li>Navigate to: Configure → JWT Templates</li>
                <li>Look for a template named exactly <code className="bg-gray-200 px-1 rounded">supabase</code></li>
                <li>If missing, click "New template" and name it "supabase"</li>
              </ul>
            </li>
            <li>
              <strong>Configure JWT Template claims:</strong>
              <pre className="bg-gray-100 p-2 rounded text-xs mt-1 overflow-auto">
{`{
  "role": "authenticated",
  "email": "{{user.primary_email_address}}",
  "app_metadata": {
    "provider": "clerk"
  }
}`}
              </pre>
            </li>
            <li>
              <strong>Ensure template settings:</strong>
              <ul className="list-disc ml-6 mt-1">
                <li>Algorithm: RS256</li>
                <li>Token lifetime: 3600 seconds (1 hour)</li>
                <li>Status: Active</li>
              </ul>
            </li>
            <li>
              <strong>After creating/updating template:</strong> Refresh this page
            </li>
          </ol>
        </div>
      )}
    </div>
  )
}

