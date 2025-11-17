'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'

export default function TestAuthWorkingPage() {
  const { isLoaded, isSignedIn } = useAuth()
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function testAuth() {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/auth/me')
      const data = await response.json()
      
      if (!response.ok) {
        setError(data.error || 'API request failed')
      } else {
        setResult(data)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      testAuth()
    }
  }, [isLoaded, isSignedIn])

  if (!isLoaded) {
    return <div className="p-8">Loading...</div>
  }

  if (!isSignedIn) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Test Auth Working</h1>
        <p className="text-red-600">Please sign in to test authentication</p>
        <a href="/sign-in" className="text-blue-600 underline">Go to Sign In</a>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">✅ Authentication Workaround Test</h1>

      <div className="mb-6 bg-blue-50 border border-blue-300 p-4 rounded">
        <h2 className="font-bold mb-2">How This Works:</h2>
        <ol className="list-decimal ml-6 space-y-1 text-sm">
          <li>Clerk handles frontend authentication (✅ working)</li>
          <li>API routes verify Clerk sessions on the server</li>
          <li>Server uses Supabase service role key (bypasses broken RS256 auth)</li>
          <li>Manual RLS enforcement based on Clerk user ID</li>
        </ol>
      </div>

      {loading && (
        <div className="bg-gray-100 p-4 rounded">
          <p>Testing authentication...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 p-4 rounded mb-6">
          <p className="font-bold text-red-800">Error</p>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="bg-green-100 border border-green-400 p-4 rounded">
            <p className="font-bold text-green-800 text-lg">✅ Authentication Working!</p>
            <p className="text-green-700 mt-2">
              Server successfully verified your Clerk session and accessed Supabase with service role key.
            </p>
          </div>

          <div className="bg-white border rounded p-4">
            <h2 className="text-xl font-bold mb-2">Clerk User Info</h2>
            <pre className="bg-gray-100 p-2 rounded overflow-auto text-sm">
              {JSON.stringify(result.clerk, null, 2)}
            </pre>
          </div>

          <div className="bg-white border rounded p-4">
            <h2 className="text-xl font-bold mb-2">Supabase User Record</h2>
            <pre className="bg-gray-100 p-2 rounded overflow-auto text-sm">
              {JSON.stringify(result.supabase, null, 2)}
            </pre>
          </div>

          <div className="bg-yellow-50 border border-yellow-300 p-4 rounded">
            <h2 className="font-bold mb-2">What This Means:</h2>
            <ul className="list-disc ml-6 space-y-1">
              <li>✅ Clerk authentication is working</li>
              <li>✅ Server-side Clerk session verification works</li>
              <li>✅ Supabase connection works (via service role)</li>
              <li>✅ User record exists in Supabase database</li>
              <li>✅ You can now build features using this auth pattern</li>
            </ul>
          </div>

          <div className="bg-white border rounded p-4">
            <h2 className="text-xl font-bold mb-2">Next Steps:</h2>
            <ol className="list-decimal ml-6 space-y-2">
              <li>Create API routes for your features (asks, bids, etc.)</li>
              <li>Use <code className="bg-gray-200 px-1 rounded">getAuthenticatedSupabaseClient()</code> in API routes</li>
              <li>Always set user IDs on the server, never trust client input</li>
              <li>Client makes fetch() calls to your API routes</li>
            </ol>
          </div>
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={testAuth}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? 'Testing...' : 'Test Again'}
        </button>
      </div>
    </div>
  )
}

