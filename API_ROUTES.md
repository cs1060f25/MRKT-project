# MRKT API Routes

This document explains the API routes that handle authenticated operations using the Clerk + Supabase workaround.

## Overview

Because we're using Clerk for authentication and Supabase for data storage, we cannot use Supabase's RPC functions directly from the client. Instead, we use Next.js API routes that:

1. Verify the Clerk session on the server
2. Use the Supabase service role key to bypass RLS
3. Validate that users can only perform actions on their own behalf
4. Auto-create users in the database if they don't exist

## Available Routes

### 1. Create Bid: `POST /api/bids/create`

Creates a new bid for an event.

**Authentication**: Requires Clerk session

**Request Body**:
```json
{
  "eventId": "uuid-of-event",
  "priceCents": 5000,
  "qty": 2,
  "buyerId": "clerk-user-id"
}
```

**Validation**:
- User must be authenticated via Clerk
- `buyerId` must match the authenticated user's ID (prevents creating bids for others)
- Event must exist
- Price and quantity must be positive numbers

**Response (Success)**:
```json
{
  "success": true,
  "bid": {
    "id": "uuid",
    "event_id": "uuid",
    "buyer_id": "user_xxx",
    "price_cents": 5000,
    "qty": 2,
    "status": "open",
    "created_at": "2024-11-09T..."
  }
}
```

**Response (Error)**:
```json
{
  "error": "Error message here"
}
```

**Status Codes**:
- `200` - Success
- `400` - Invalid input
- `401` - Not authenticated
- `403` - Trying to create bid for someone else
- `404` - Event not found
- `500` - Server error

### 2. Create Ask: `POST /api/asks/create`

Creates a new ask (listing) for an event.

**Authentication**: Requires Clerk session

**Request Body**:
```json
{
  "eventId": "uuid-of-event",
  "priceCents": 7500,
  "qty": 1,
  "qrStoragePath": "path/to/qr.png",
  "sellerId": "clerk-user-id"
}
```

**Validation**:
- User must be authenticated via Clerk
- `sellerId` must match the authenticated user's ID
- Event must exist
- Price and quantity must be positive numbers
- QR storage path must be provided

**Response (Success)**:
```json
{
  "success": true,
  "ask": {
    "id": "uuid",
    "event_id": "uuid",
    "seller_id": "user_xxx",
    "price_cents": 7500,
    "qty": 1,
    "qr_storage_path": "path/to/qr.png",
    "status": "open",
    "created_at": "2024-11-09T..."
  }
}
```

**Response (Error)**:
```json
{
  "error": "Error message here"
}
```

**Status Codes**:
- `200` - Success
- `400` - Invalid input
- `401` - Not authenticated
- `403` - Trying to create ask for someone else
- `404` - Event not found
- `500` - Server error

### 3. Create Listing (Alternative): `POST /api/listings`

**Note**: This is an alternative implementation for creating asks. Use either this or `/api/asks/create`.

This route is more feature-complete and includes:
- Automatic user creation from Clerk data
- Better error messages
- More comprehensive validation

See `/Users/jamielinsdell/COMP1060/MRKT-project/mrkt/app/api/listings/route.ts` for details.

### 4. Seed Database: `POST /api/seed`

Seeds the database with dummy data for testing.

**Authentication**: None (should be removed in production!)

**Response**:
```json
{
  "success": true,
  "message": "Database seeded successfully",
  "data": {
    "users": 3,
    "events": 6,
    "asks": 3,
    "bids": 3
  }
}
```

**⚠️ Security**: This route should be removed or protected before deploying to production!

### 5. Get Current User: `GET /api/auth/me`

Fetches the current user's data from Supabase.

**Authentication**: Requires Clerk session

**Response (Success)**:
```json
{
  "user": {
    "id": "user_xxx",
    "email": "user@example.com",
    "full_name": "John Doe",
    "created_at": "2024-11-09T...",
    "updated_at": "2024-11-09T..."
  }
}
```

**Response (Error)**:
```json
{
  "error": "Authentication required"
}
```

## Frontend Usage

### Creating a Bid

```typescript
'use client'

import { useSupabase } from '@/providers/supabase-provider'

export function BidButton({ eventId }: { eventId: string }) {
  const { supabaseUserId } = useSupabase() // Clerk user ID
  
  async function createBid() {
    const response = await fetch('/api/bids/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId,
        priceCents: 5000, // $50.00
        qty: 2,
        buyerId: supabaseUserId, // Must match authenticated user
      }),
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      console.error('Failed to create bid:', data.error)
      return
    }
    
    console.log('Bid created:', data.bid)
  }
  
  return <button onClick={createBid}>Place Bid</button>
}
```

### Creating an Ask

```typescript
'use client'

import { useSupabase } from '@/providers/supabase-provider'

export function AskButton({ eventId, qrPath }: { eventId: string, qrPath: string }) {
  const { supabaseUserId } = useSupabase()
  
  async function createAsk() {
    const response = await fetch('/api/asks/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId,
        priceCents: 7500, // $75.00
        qty: 1,
        qrStoragePath: qrPath,
        sellerId: supabaseUserId, // Must match authenticated user
      }),
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      console.error('Failed to create ask:', data.error)
      return
    }
    
    console.log('Ask created:', data.ask)
  }
  
  return <button onClick={createAsk}>Create Listing</button>
}
```

## Architecture Notes

### Why API Routes?

1. **Authentication Mismatch**: Clerk JWTs aren't properly verified by Supabase (local or cloud)
2. **RLS Bypass**: Service role key allows us to bypass RLS and implement custom authorization
3. **Auto-User Creation**: We can automatically create user records from Clerk data
4. **Better Error Handling**: API routes provide more control over error messages and validation

### Security Considerations

✅ **Good**:
- Clerk verifies sessions on the server
- Service role key never exposed to client
- Authorization checks ensure users only act on their own behalf
- Input validation prevents malicious data

⚠️ **Important**:
- Always validate `buyerId` / `sellerId` matches the authenticated user
- Never trust client-provided user IDs without verification
- Remove `/api/seed` route before production deployment

### Performance

- API routes add a server round-trip compared to direct RPC calls
- However, this is negligible for most use cases
- Consider caching user data to avoid repeated lookups

## Troubleshooting

### Error: "Authentication required"

**Cause**: User is not signed in to Clerk

**Fix**: Redirect to `/sign-in` or show a sign-in modal

### Error: "You can only create bids for yourself"

**Cause**: The `buyerId` in the request doesn't match the authenticated user's Clerk ID

**Fix**: Use `supabaseUserId` from the `useSupabase()` hook, which contains the Clerk user ID

### Error: "Event not found"

**Cause**: The `eventId` doesn't exist in the database

**Fix**: Ensure the event exists and the ID is correct. Check for typos or UUID format issues.

### Error: "Failed to initialize user account"

**Cause**: Auto-user creation failed (database error)

**Fix**: Check Supabase logs and ensure the `users` table accepts TEXT IDs (not UUIDs)

## Related Files

- `/Users/jamielinsdell/COMP1060/MRKT-project/mrkt/app/api/bids/create/route.ts`
- `/Users/jamielinsdell/COMP1060/MRKT-project/mrkt/app/api/asks/create/route.ts`
- `/Users/jamielinsdell/COMP1060/MRKT-project/mrkt/app/api/listings/route.ts`
- `/Users/jamielinsdell/COMP1060/MRKT-project/mrkt/components/buy/BidForm.tsx`
- `/Users/jamielinsdell/COMP1060/MRKT-project/mrkt/lib/supabase/server/serviceClient.ts`
- `/Users/jamielinsdell/COMP1060/MRKT-project/CLERK_SUPABASE_WORKAROUND.md`

