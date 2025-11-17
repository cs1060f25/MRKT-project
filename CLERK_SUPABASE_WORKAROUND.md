# Clerk + Supabase Authentication Workaround

## Problem

Supabase Cloud's third-party Clerk integration is not properly verifying RS256 JWTs. Even with Clerk configured in the Supabase dashboard, requests fail with:

```
{"code":"bad_jwt","message":"invalid JWT: unable to parse or verify signature, token signature is invalid: signing method RS256 is invalid"}
```

## Root Cause

Supabase Cloud is not fetching Clerk's JWKS (JSON Web Key Set) to verify RS256 signatures, despite Clerk being "enabled" in the dashboard. This appears to be a bug in Supabase's Clerk integration.

## Workaround Solution

Instead of relying on Supabase to verify Clerk JWTs, we:

1. **Frontend:** Continue using Clerk for authentication (works perfectly)
2. **Backend:** Create API routes that:
   - Verify Clerk sessions using `@clerk/nextjs/server`
   - Use Supabase service role key to access database
   - Manually enforce RLS-like permissions based on Clerk user ID

## Architecture

```
┌─────────┐
│ Browser │
└────┬────┘
     │ 1. Clerk Auth (works)
     ▼
┌─────────────┐
│  Clerk SDK  │
└────┬────────┘
     │ 2. Verified Session
     ▼
┌──────────────────┐
│  Next.js API     │
│  Routes          │
│                  │
│  Uses:           │
│  - Clerk auth()  │
│  - Service role  │
└────┬─────────────┘
     │ 3. Service role queries (bypasses RLS)
     ▼
┌──────────────────┐
│  Supabase Cloud  │
│  (Database)      │
└──────────────────┘
```

## Implementation

### 1. Clerk-Supabase Bridge (`lib/auth/clerk-supabase-bridge.ts`)

Helper functions that:
- Get authenticated Supabase client with Clerk user context
- Ensure user exists in Supabase `users` table
- Provide Clerk user ID for manual permission checks

### 2. Auth API Route (`app/api/auth/me/route.ts`)

Returns current user info from both Clerk and Supabase:

```typescript
GET /api/auth/me

Response:
{
  "clerk": { /* Clerk user info */ },
  "supabase": { /* Supabase user record */ },
  "authenticated": true
}
```

### 3. Updated SupabaseProvider (Client-Side)

Modified to:
- Disable session persistence (since we're not using Supabase auth)
- Use API routes for authenticated operations
- Still provide Supabase client for public data queries

## Usage

### Client-Side (Public Data)

```typescript
'use client'
import { useSupabase } from '@/providers/supabase-provider'

export function EventsList() {
  const { supabase } = useSupabase()
  
  // Query public data (no auth needed)
  const { data: events } = await supabase
    .from('events')
    .select('*')
  
  return <div>{/* render events */}</div>
}
```

### Server-Side (Authenticated Operations)

```typescript
// app/api/asks/route.ts
import { getAuthenticatedSupabaseClient } from '@/lib/auth/clerk-supabase-bridge'

export async function POST(request: Request) {
  const { supabase, userId } = await getAuthenticatedSupabaseClient()
  const body = await request.json()
  
  // Manually enforce: user can only create asks for themselves
  const { data, error } = await supabase
    .from('asks')
    .insert({
      ...body,
      seller_id: userId, // Force seller_id to authenticated user
    })
  
  return Response.json({ data, error })
}
```

### Client Calling Server API

```typescript
'use client'

async function createAsk(askData) {
  const response = await fetch('/api/asks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(askData),
  })
  
  return response.json()
}
```

## Security Considerations

### ✅ Secure

- Clerk sessions are verified on the server using `@clerk/nextjs/server`
- Service role key is only used on the server (never exposed to client)
- User IDs are explicitly checked before database operations
- No way for client to impersonate another user

### ⚠️ Important

- **Always** use the Clerk `userId` from the bridge, never trust client input
- **Always** set `seller_id`, `buyer_id`, etc. explicitly on the server
- **Never** let clients specify user IDs in request bodies

### Example: Bad vs Good

```typescript
// ❌ BAD - Trusts client input
export async function POST(request: Request) {
  const body = await request.json()
  const { supabase } = await getAuthenticatedSupabaseClient()
  
  // Client could send any seller_id!
  await supabase.from('asks').insert(body)
}

// ✅ GOOD - Enforces server-side user ID
export async function POST(request: Request) {
  const body = await request.json()
  const { supabase, userId } = await getAuthenticatedSupabaseClient()
  
  // Server sets seller_id, client can't override
  await supabase.from('asks').insert({
    ...body,
    seller_id: userId,
  })
}
```

## Testing

### Test Current User

```bash
curl http://localhost:3000/api/auth/me \
  -H "Cookie: __session=..."
```

Expected response:
```json
{
  "clerk": {
    "id": "user_34vzEy76jAWsF3V3TxIo2miUmJk",
    "email": "jlinsdell@mba2026.hbs.edu",
    "firstName": "Jamie",
    "lastName": "Linsdell"
  },
  "supabase": {
    "id": "user_34vzEy76jAWsF3V3TxIo2miUmJk",
    "email": "jlinsdell@mba2026.hbs.edu",
    "first_name": "Jamie",
    "last_name": "Linsdell",
    "created_at": "2025-01-09T..."
  },
  "authenticated": true
}
```

## Migration Path

When Supabase fixes their Clerk integration:

1. Update `SupabaseProvider` to use proper session management
2. Replace API routes with direct client calls
3. Remove `clerk-supabase-bridge.ts`
4. Re-enable RLS policies

For now, this workaround provides a secure, functional authentication system.

## Summary

✅ **Frontend:** Clerk authentication works perfectly
✅ **Backend:** Server-side auth with service role key
✅ **Security:** Manual RLS enforcement on server
✅ **Functional:** All CRUD operations work
⚠️ **Temporary:** Until Supabase fixes Clerk integration

---

**Status:** Implemented and working
**Last Updated:** January 2025

