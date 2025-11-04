/**
 * Supabase Server Clients - Barrel Export
 *
 * This file exports all server-side Supabase clients for easier imports.
 *
 * User-scoped clients (RLS-aware):
 * - createServerClient
 * - createRouteHandlerClient
 * - createServerActionClient
 *
 * Service-role client (bypasses RLS):
 * - getServiceClient
 */

// User-scoped clients (from server.ts)
export {
  createServerClient,
  createRouteHandlerClient,
  createServerActionClient,
} from './server'

// Service-role client (from serviceClient.ts)
export {
  getServiceClient,
  assertServerOnly,
  type ServiceClientContext,
} from './serviceClient'
