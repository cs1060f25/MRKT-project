# Supabase + Clerk Integration Guide

This guide explains how to set up Supabase with Clerk authentication for RLS-aware database access.

## Architecture

```
User → Clerk Auth → JWT with Supabase Claims → Supabase Client → RLS Policies
```

1. User signs in via Clerk
2. Clerk generates JWT with custom Supabase claims
3. Supabase client uses JWT for authentication
4. RLS policies use `auth.uid()` from JWT to enforce row-level security

---

## Setup Steps

### 1. Configure Environment Variables

Create `.env.local` in the `mrkt/` directory:

```bash
# Copy the example file
cp .env.local.example .env.local
```

**For local development:**
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase status>

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<from Clerk dashboard>
CLERK_SECRET_KEY=<from Clerk dashboard>
```

**For production:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://kgnpbrdrqsqpcyvzbhjx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your production anon key>

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<from Clerk dashboard>
CLERK_SECRET_KEY=<from Clerk dashboard>
```

---

### 2. Configure Clerk JWT Template

This is the **most important step** to make RLS work with Clerk authentication.

#### a. Go to Clerk Dashboard

1. Navigate to: https://dashboard.clerk.com
2. Select your application
3. Go to **"JWT Templates"** in the sidebar
4. Click **"New template"**
5. Select **"Supabase"** from the presets (or create a blank template)

#### b. Configure the Template

**Template Name:** `supabase`

**Claims:**
```json
{
  "aud": "authenticated",
  "exp": {{expires_at}},
  "iat": {{issued_at}},
  "iss": "https://kgnpbrdrqsqpcyvzbhjx.supabase.co/auth/v1",
  "sub": "{{user.id}}",
  "email": "{{user.primary_email_address}}",
  "phone": "{{user.primary_phone_number}}",
  "app_metadata": {
    "provider": "clerk",
    "providers": ["clerk"]
  },
  "user_metadata": {
    "full_name": "{{user.full_name}}",
    "avatar_url": "{{user.profile_image_url}}"
  },
  "role": "authenticated",
  "session_id": "{{session.id}}"
}
```

**Key Points:**
- `sub` **MUST** be `{{user.id}}` - This becomes `auth.uid()` in RLS policies
- `aud` must be `"authenticated"` to match Supabase's role
- `role` must be `"authenticated"` for RLS to work
- `iss` should match your Supabase URL + `/auth/v1`

#### c. Save and Enable

1. Click **"Save"**
2. Ensure the template is **enabled**
3. Note the template name: `supabase` (used in the code)

---

### 3. Test the Integration

#### a. Create a Test Component

Create `mrkt/app/test-supabase/page.tsx`:

```tsx
'use client'

import { useSupabase } from '@/providers/supabase-provider'
import { useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'

export default function TestSupabasePage() {
  const supabase = useSupabase()
  const { userId } = useAuth()
  const [events, setEvents] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadEvents() {
      if (!supabase) return

      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .limit(5)

        if (error) throw error
        setEvents(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    }

    loadEvents()
  }, [supabase])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Integration Test</h1>

      <div className="mb-4">
        <strong>Clerk User ID:</strong> {userId || 'Not signed in'}
      </div>

      <div className="mb-4">
        <strong>Supabase Client:</strong>{' '}
        {supabase ? '✅ Connected' : '❌ Not initialized'}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      <div>
        <strong>Events ({events.length}):</strong>
        <pre className="bg-gray-100 p-4 rounded mt-2 overflow-auto">
          {JSON.stringify(events, null, 2)}
        </pre>
      </div>
    </div>
  )
}
```

#### b. Test RLS Enforcement

```tsx
// This should work (authenticated)
const { data } = await supabase.from('events').select('*')

// This should be filtered by RLS (only your own profile)
const { data } = await supabase.from('users').select('*')

// This should only return asks where seller_id = your Clerk user ID
const { data } = await supabase.from('asks').select('*')
```

---

## Usage Patterns

### Client Components

```tsx
'use client'

import { useSupabase } from '@/providers/supabase-provider'

export function MyComponent() {
  const supabase = useSupabase()

  async function createEvent() {
    const { data, error } = await supabase
      .from('events')
      .insert({
        title: 'New Event',
        starts_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + 86400000).toISOString(),
        org: 'My Org'
      })

    // created_by is automatically set to auth.uid() by RLS
  }

  return <button onClick={createEvent}>Create Event</button>
}
```

### Server Components

```tsx
import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export default async function ServerComponent() {
  const cookieStore = await cookies()
  const supabase = createServerClient(cookieStore)

  const { data: events } = await supabase
    .from('events')
    .select('*')

  return <div>{/* Render events */}</div>
}
```

### Route Handlers (API Routes)

```tsx
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient(cookieStore)

  const { data, error } = await supabase
    .from('events')
    .select('*')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
```

### Server Actions

```tsx
'use server'

import { createServerActionClient } from '@/lib/supabase/server'

export async function createEvent(formData: FormData) {
  const supabase = await createServerActionClient()

  const { data, error } = await supabase
    .from('events')
    .insert({
      title: formData.get('title'),
      // ... other fields
    })

  if (error) throw error
  return data
}
```

### RPC Functions (Recommended)

```tsx
'use client'

import { useSupabase } from '@/providers/supabase-provider'

export function CreateAsk() {
  const supabase = useSupabase()

  async function createAsk() {
    const { data, error } = await supabase
      .rpc('rpc_create_ask', {
        event_id: 'uuid-here',
        price_cents: 5000,
        qty: 1,
        qr_storage_path: 'path/to/qr.png'
      })

    // Automatically validates input and sets seller_id to auth.uid()
  }

  return <button onClick={createAsk}>Create Ask</button>
}
```

---

## How RLS Works with Clerk

When a user signs in via Clerk:

1. Clerk creates a session
2. Your app calls `getToken({ template: 'supabase' })`
3. Clerk returns a JWT with:
   ```json
   {
     "sub": "user_2Xj4k...",  // Clerk user ID
     "role": "authenticated",
     "aud": "authenticated"
   }
   ```
4. Supabase client uses this JWT
5. In RLS policies, `auth.uid()` returns `"user_2Xj4k..."`
6. Policies like `seller_id = auth.uid()` work correctly

---

## Troubleshooting

### Error: "JWT verification failed"

**Cause:** Clerk JWT template is not configured correctly

**Fix:**
1. Verify the JWT template name is `supabase`
2. Check that `iss` matches your Supabase URL
3. Ensure template is **enabled** in Clerk dashboard

### Error: "Row violates RLS policy"

**Cause:** User is trying to access data they don't own

**Fix:**
1. This is expected! RLS is working correctly
2. Check your RLS policies in the database
3. Verify the user is authenticated (check `auth.uid()`)

### Error: "auth.uid() returns null"

**Cause:** JWT is not being passed to Supabase

**Fix:**
1. Verify user is signed in via Clerk
2. Check that `getToken({ template: 'supabase' })` is being called
3. Inspect the JWT payload in your browser's developer tools
4. Ensure `SupabaseProvider` is wrapping your components

### Events/Asks not showing up

**Cause:** RLS is filtering them (you don't own them)

**Fix:**
1. Check the `seller_id` / `created_by` matches your `auth.uid()`
2. Use the seed data which has known UUIDs
3. Create test data with your actual Clerk user ID

---

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never expose Service Role Key** - Only use anon key in the browser
2. **Always use RLS** - All tables should have RLS enabled
3. **Trust Clerk JWTs** - JWT signature verification is handled by Supabase
4. **Validate Input** - Use RPC functions with validation for writes
5. **Test RLS Policies** - Use the pgTAP tests to verify policies work

---

## Next Steps

1. ✅ Set up Clerk JWT template
2. ✅ Configure environment variables
3. ✅ Test the integration with `/test-supabase` page
4. Build your first feature using RLS-aware queries
5. Write tests for your RLS policies

For more information:
- Clerk Docs: https://clerk.com/docs
- Supabase Docs: https://supabase.com/docs
- RLS Guide: https://supabase.com/docs/guides/auth/row-level-security
