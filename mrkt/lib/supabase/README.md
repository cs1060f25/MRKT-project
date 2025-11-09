# Supabase Client Utilities

This directory contains SSR-safe Supabase clients for different rendering contexts in Next.js.

## Files

### `client.ts` - Browser/Client Components
Use this in Client Components (components with `'use client'` directive).

```tsx
'use client'
import { createBrowserClient } from '@/lib/supabase/client'

const supabase = createBrowserClient()
```

### `server.ts` - Server Components & Route Handlers
Use these in Server Components, Route Handlers, and Server Actions.

```tsx
// Server Component
import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

const cookieStore = await cookies()
const supabase = createServerClient(cookieStore)
```

```tsx
// Route Handler
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

const cookieStore = await cookies()
const supabase = createRouteHandlerClient(cookieStore)
```

```tsx
// Server Action
import { createServerActionClient } from '@/lib/supabase/server'

const supabase = await createServerActionClient()
```

### `middleware.ts` - Next.js Middleware
Use this in `middleware.ts` to refresh sessions before page loads.

```tsx
import { createMiddlewareClient } from '@/lib/supabase/middleware'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient(req, res)

  // Refresh session
  await supabase.auth.getSession()

  return res
}
```

## Quick Reference

| Context | Import | Usage |
|---------|--------|-------|
| Client Component | `createBrowserClient` from `client.ts` | `const supabase = createBrowserClient()` |
| Server Component | `createServerClient` from `server.ts` | `const supabase = createServerClient(cookies())` |
| Route Handler | `createRouteHandlerClient` from `server.ts` | `const supabase = createRouteHandlerClient(cookies())` |
| Server Action | `createServerActionClient` from `server.ts` | `const supabase = await createServerActionClient()` |
| Middleware | `createMiddlewareClient` from `middleware.ts` | `const supabase = createMiddlewareClient(req, res)` |

## Features

- ✅ **SSR-Safe**: All clients handle cookies correctly for server-side rendering
- ✅ **RLS-Aware**: Uses Clerk JWT for row-level security
- ✅ **Type-Safe**: Full TypeScript support
- ✅ **Automatic Refresh**: Session tokens refresh automatically

## RLS Integration

All clients automatically use the authenticated user's JWT token from Clerk, which means:

1. `auth.uid()` in RLS policies returns the Clerk user ID
2. Queries are automatically filtered by RLS
3. No need to manually pass user IDs

Example:
```tsx
// This query is automatically filtered to only show the user's own asks
const { data } = await supabase
  .from('asks')
  .select('*')
// Only returns asks where seller_id = auth.uid()
```

## See Also

- [Full Integration Guide](../SUPABASE_INTEGRATION.md)
- [Provider Documentation](../../providers/supabase-provider.tsx)
