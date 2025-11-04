# Supabase Database - MRKT Project

This directory contains all database-related files for the MRKT marketplace application.

## Directory Structure

```
supabase/
├── migrations/          # Database schema migrations
├── tests/              # pgTAP test suites
├── seed/               # Seed data for development
├── config.toml         # Supabase configuration
└── README.md           # This file
```

---

## Environment Variables

### Client-Side (Public)

**NEXT_PUBLIC_SUPABASE_URL**
- Supabase project URL
- Safe to expose to the browser
- Used by all client-side code

**NEXT_PUBLIC_SUPABASE_ANON_KEY**
- Anonymous/public API key
- Subject to Row Level Security (RLS) policies
- Used for user-scoped database operations
- Safe to expose to the browser

### Server-Side (Secret)

**SUPABASE_SERVICE_ROLE_KEY** ⚠️
- **NEVER expose to the client**
- Bypasses ALL Row Level Security policies
- Full database access with no restrictions
- Only use in server-side code:
  - API routes (`app/api/**/route.ts`)
  - Server actions (`'use server'`)
  - Edge functions
- Required for privileged operations (auction engine, delivery, admin tasks)

---

## Client Types and Usage

### 1. Browser Client (Client Components)

**File:** `mrkt/lib/supabase/client.ts`

**When to use:** Client components with `'use client'` directive

**Features:**
- RLS-aware (uses Clerk JWT)
- Automatic token refresh
- User-scoped access

**Example:**
```typescript
'use client'
import { useSupabase } from '@/providers/supabase-provider'

export function MyComponent() {
  const supabase = useSupabase()

  // Query with RLS - only sees user's own data
  const { data } = await supabase
    .from('asks')
    .select('*')
}
```

---

### 2. Server Client (Server Components)

**File:** `mrkt/lib/supabase/server/server.ts`

**When to use:** Server Components, Route Handlers, Server Actions

**Features:**
- SSR-safe cookie handling
- RLS-aware (uses Clerk JWT from middleware)
- Different variants for different contexts

**Example:**
```typescript
import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createServerClient(cookieStore)

  const { data } = await supabase.from('events').select('*')
  return <div>{/* render */}</div>
}
```

---

### 3. Service Role Client (Privileged Operations) ⚠️

**File:** `mrkt/lib/supabase/server/serviceClient.ts`

**When to use:**
- Auction engine (creating matches)
- Delivery jobs (marking tickets as delivered)
- Internal automation
- Admin operations
- **Any operation that needs to bypass RLS**

**⚠️ SECURITY WARNINGS:**
- Bypasses ALL RLS policies
- Full unrestricted database access
- Never import in client components
- Only use when absolutely necessary

**Features:**
- Uses `SUPABASE_SERVICE_ROLE_KEY`
- Automatic logging for audit trail
- Trace headers for request correlation
- Server-only runtime check

**Example:**
```typescript
// app/api/auction/route.ts
import { getServiceClient } from '@/lib/supabase/server/serviceClient'

export async function POST() {
  const supabase = getServiceClient({
    functionName: 'auction-engine',
    traceId: crypto.randomUUID()
  })

  // Insert match (bypasses RLS - auction engine privilege)
  const { data } = await supabase
    .from('matches')
    .insert({
      ask_id: '...',
      bid_id: '...',
      clearing_price_cents: 5000,
      qty: 1
    })

  return Response.json({ data })
}
```

---

## Service Role Access - Detailed Guide

### What is the Service Role?

The service role is a special PostgreSQL role with **superuser-level privileges** on your Supabase database. It:

- Bypasses ALL Row Level Security (RLS) policies
- Can read, write, update, delete any data
- Can execute any SQL function
- Can modify database schema (if needed)

### When to Use Service Role

✅ **Use service role for:**
- Auction engine creating matches between asks/bids
- Delivery system marking tickets as delivered
- Background jobs processing system-wide operations
- Admin dashboards with elevated privileges
- Internal APIs that aggregate data across users

❌ **DO NOT use service role for:**
- User-initiated CRUD operations (use RLS instead)
- Client-side code (NEVER)
- Operations that should respect user permissions
- Public API endpoints

### Security Best Practices

1. **Never expose the key:**
   - Don't commit `SUPABASE_SERVICE_ROLE_KEY` to git
   - Don't log the key value
   - Don't include in client bundles
   - Store in secure environment variables only

2. **Validate inputs:**
   ```typescript
   export async function POST(request: Request) {
     const body = await request.json()

     // Validate ALL inputs before using service client
     if (!body.askId || !body.bidId) {
       return Response.json({ error: 'Invalid input' }, { status: 400 })
     }

     const supabase = getServiceClient({ functionName: 'auction' })
     // ... safe to proceed
   }
   ```

3. **Use context for logging:**
   ```typescript
   const supabase = getServiceClient({
     functionName: 'auction-engine',
     traceId: request.headers.get('x-request-id') || crypto.randomUUID()
   })
   ```

4. **Audit logs:**
   All service role operations are logged with:
   - Timestamp
   - Function name
   - Trace ID
   - Operation type
   - RPC name and parameters

   Example log output:
   ```
   [service-role] 2024-11-03T10:30:45.123Z | Function: auction-engine | Trace: uuid-... | Operation: RPC: rpc_create_match | Details: {"params":{"ask_id":"..."}}
   ```

### Testing Service Role Access

**File:** `supabase/tests/06_servicekey_pgtap.sql`

Tests verify:
- ✅ Regular users cannot insert into matches (RLS blocks)
- ✅ Service role can insert into matches (bypasses RLS)
- ✅ Service role can update any user's data
- ✅ Service role can execute privileged RPCs
- ✅ Regular users still subject to RLS after service operations

Run tests:
```bash
npm run db:test
# or
supabase test db supabase/tests/06_servicekey_pgtap.sql
```

---

## Database Migrations

Migrations are applied in order based on timestamp prefix.

### Creating a Migration

```bash
supabase migration new my_migration_name
```

This creates a new file: `supabase/migrations/YYYYMMDDHHMMSS_my_migration_name.sql`

### Applying Migrations

**Local:**
```bash
supabase db reset  # Resets and applies all migrations + seed data
```

**Production:**
```bash
supabase db push  # Pushes pending migrations to production
```

---

## Testing

We use [pgTAP](https://pgtap.org/) for database testing.

### Test Files

1. `01_schema_pgtap.sql` - Schema validation (104 tests)
2. `02_rls_pgtap.sql` - Row Level Security policies (37 tests)
3. `03_rpc_surface_pgtap.sql` - RPC function interfaces (18 tests)
4. `04_rpc_functions_pgtap.sql` - RPC function behavior (31 tests)
5. `05_storage_pgtap.sql` - Storage bucket policies (19 tests)
6. `06_servicekey_pgtap.sql` - Service role access (11 tests)

**Total: 220 tests**

### Running Tests

**All tests:**
```bash
npm run db:test
```

**Individual test file:**
```bash
supabase test db supabase/tests/01_schema_pgtap.sql
```

**Specific test suite with reset:**
```bash
npm run db:reset && supabase test db supabase/tests/06_servicekey_pgtap.sql
```

---

## Seed Data

**File:** `supabase/seed/01_seed.sql`

Seed data includes:
- 2 test users (seller, buyer)
- 1 test event
- 1 test ask (open)
- 1 test bid (open)

Seed data is applied automatically during `supabase db reset`.

---

## Row Level Security (RLS)

All tables have RLS enabled. Policies enforce:

- **Users:** Can only read their own profile
- **Events:** Creators can manage their own events
- **Asks:** Sellers can manage their own asks (open only)
- **Bids:** Buyers can manage their own bids (open only)
- **Matches:** All authenticated users can read (market transparency)
- **Tickets:** Winners and sellers can read ticket data
- **Storage:** Sellers can upload/delete QRs for their asks, winners can read

**RLS is bypassed** when using service role client.

---

## Storage

**Bucket:** `qr_codes` (private)

**Path convention:** `{event_id}/{ask_id or ticket_id}/qr.png`

**Access control:**
- Sellers can upload QR codes for their asks
- Winners can read QR codes for their tickets
- Updates are denied (immutable)
- Sellers can delete QRs for open asks only

**Helpers:**
- `public.validate_qr_storage_path(path)` - Validates path format
- `public.generate_qr_storage_path(event_id, resource_id, extension)` - Generates path

---

## RPC Functions

### User-Scoped RPCs (Use regular client)

- `rpc_create_event` - Create event
- `rpc_create_ask` - Create ask with validation
- `rpc_create_bid` - Create bid with validation
- `rpc_get_book` - Get aggregated order book

### System RPCs (May need service role)

- `rpc_mark_ticket_delivered` - Mark ticket as delivered (requires elevated access)

---

## Common Pitfalls

### ❌ Importing service client in client component
```typescript
// ❌ WRONG - Will throw error
'use client'
import { getServiceClient } from '@/lib/supabase/server/serviceClient'
// Error: Service client can only be used in server-side code
```

### ✅ Correct usage in API route
```typescript
// ✅ CORRECT
// app/api/admin/route.ts
import { getServiceClient } from '@/lib/supabase/server/serviceClient'

export async function GET() {
  const supabase = getServiceClient({ functionName: 'admin-dashboard' })
  // ...
}
```

### ❌ Using service role for user operations
```typescript
// ❌ WRONG - Should use RLS instead
const supabase = getServiceClient()
await supabase.from('asks').insert({ /* user's ask */ })
```

### ✅ Use RLS for user operations
```typescript
// ✅ CORRECT
import { useSupabase } from '@/providers/supabase-provider'
const supabase = useSupabase() // RLS enforces user ownership
await supabase.rpc('rpc_create_ask', { /* params */ })
```

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [pgTAP Documentation](https://pgtap.org/)
- [Next.js + Supabase](https://supabase.com/docs/guides/auth/server-side/nextjs)

---

## Getting Help

If you encounter issues:

1. Check test output: `npm run db:test`
2. Review RLS policies: `supabase/migrations/*_rls.sql`
3. Check logs for service role operations: Look for `[service-role]` prefix
4. Verify environment variables are set correctly

For service role issues:
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`
- Check that you're importing from server-side code only
- Review audit logs for operation history
