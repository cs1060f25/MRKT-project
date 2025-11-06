/**
 * Supabase Service Role Client (SERVER-ONLY)
 *
 * @server-only
 *
 * ⚠️ SECURITY WARNING ⚠️
 * This client uses the service-role key which BYPASSES ALL RLS POLICIES.
 *
 * DO NOT import this file in client components or expose it to the browser.
 * Only use in:
 * - API routes (route handlers in app/api directory)
 * - Server actions ('use server')
 * - Edge functions
 *
 * Purpose:
 * - Internal automation (auction engine, delivery jobs)
 * - Privileged database operations that require elevated access
 * - Operations that need to bypass RLS for system-level tasks
 *
 * All operations are logged for auditability.
 */

import { createClient } from '@supabase/supabase-js'

/**
 * Context for service client operations
 * Used for logging and tracing
 */
export interface ServiceClientContext {
  /**
   * Name of the calling function (for logging)
   * Example: 'auction-engine', 'delivery-job', 'admin-task'
   */
  functionName?: string

  /**
   * Optional trace ID for request correlation
   */
  traceId?: string
}

/**
 * Logger for service role operations
 * Logs all operations with [service-role] prefix for auditability
 */
function logServiceOperation(
  operation: string,
  context?: ServiceClientContext,
  details?: Record<string, any>
) {
  const timestamp = new Date().toISOString()
  const functionName = context?.functionName || 'unknown'
  const traceId = context?.traceId || '-'

  console.log(
    `[service-role] ${timestamp} | Function: ${functionName} | Trace: ${traceId} | Operation: ${operation}`,
    details ? `| Details: ${JSON.stringify(details)}` : ''
  )
}

/**
 * Get a Supabase client with service-role privileges
 *
 * This client bypasses Row Level Security (RLS) and has full database access.
 * Use with extreme caution and only for operations that require elevated privileges.
 *
 * @param context - Optional context for logging (function name, trace ID)
 * @returns Supabase client with service-role key
 *
 * @example
 * ```typescript
 * // In an API route
 * import { getServiceClient } from '@/lib/supabase/server/serviceClient'
 *
 * export async function POST() {
 *   const supabase = getServiceClient({ functionName: 'auction-engine' })
 *
 *   // Insert match (bypasses RLS)
 *   const { data } = await supabase
 *     .from('matches')
 *     .insert({ ... })
 *
 *   return Response.json({ data })
 * }
 * ```
 */
export function getServiceClient(context?: ServiceClientContext) {
  // Validate that service role key exists
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not defined. ' +
      'This environment variable is required for service-role operations.'
    )
  }

  // Log client creation
  logServiceOperation('Creating service client', context)

  // Create client with service-role key
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false, // No session persistence for service role
        autoRefreshToken: false, // No token refresh needed
      },
      global: {
        headers: {
          'x-client-role': 'service-role', // Identify as service role
          ...(context?.functionName && { 'x-function-name': context.functionName }),
          ...(context?.traceId && { 'x-trace-id': context.traceId }),
        },
      },
    }
  )

  // Wrap RPC calls with logging
  const originalRpc = client.rpc.bind(client)
  client.rpc = function (fn: string, params?: any, options?: any) {
    logServiceOperation(`RPC: ${fn}`, context, { params })
    return originalRpc(fn, params, options)
  }

  return client
}

/**
 * Check if code is running in a server-only context
 * Throws an error if called from client-side code
 */
export function assertServerOnly() {
  if (typeof window !== 'undefined') {
    throw new Error(
      'Service client can only be used in server-side code. ' +
      'This code is running in a browser context.'
    )
  }
}

// Immediately assert server-only context when this module is imported
assertServerOnly()
