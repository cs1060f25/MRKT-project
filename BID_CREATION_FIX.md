# Bid Creation Fix - November 9, 2024

## Problem

Users were getting an authentication error when trying to create bids:

```
[createBid] RPC error details: {}
AuthSessionMissingError: Auth session missing!
```

The error occurred in `lib/supabase/rpc.ts` when calling `rpc_create_bid`.

## Root Cause

The RPC function `rpc_create_bid` uses `current_user_id()` which internally calls `auth.uid()`. This expects a valid Supabase session, but we're using the Clerk authentication workaround where:

1. Users authenticate with Clerk (not Supabase directly)
2. The Supabase client has no authenticated session
3. `auth.uid()` returns NULL
4. The RPC function throws "Authentication required"

## Solution

Created Next.js API routes that handle authentication and database operations:

### 1. Created `/api/bids/create` Route

- **File**: `mrkt/app/api/bids/create/route.ts`
- **Purpose**: Create bids using Clerk auth + Supabase service role
- **How it works**:
  1. Verifies Clerk session on server
  2. Validates input (eventId, priceCents, qty, buyerId)
  3. Ensures buyerId matches authenticated user (prevents impersonation)
  4. Auto-creates user in database if doesn't exist
  5. Verifies event exists
  6. Inserts bid directly into database (bypasses RLS via service role key)
  7. Returns bid data to client

### 2. Created `/api/asks/create` Route

- **File**: `mrkt/app/api/asks/create/route.ts`
- **Purpose**: Create asks (listings) using same pattern
- **Note**: The existing `/api/listings` route already handles this, so this is an alternative implementation

### 3. Updated `BidForm` Component

- **File**: `mrkt/components/buy/BidForm.tsx`
- **Changes**:
  - Removed import of `createBid` from `@/lib/supabase/rpc`
  - Replaced RPC call with `fetch('/api/bids/create', ...)`
  - Uses `supabaseUserId` (Clerk user ID) from SupabaseProvider
  - Better error handling and user feedback

## Files Changed

1. `mrkt/app/api/bids/create/route.ts` - NEW
2. `mrkt/app/api/asks/create/route.ts` - NEW
3. `mrkt/components/buy/BidForm.tsx` - UPDATED
4. `API_ROUTES.md` - NEW (documentation)
5. `BID_CREATION_FIX.md` - NEW (this file)

## Testing

To test the fix:

1. Navigate to http://localhost:3000/buy/{eventId}
2. Fill out the bid form (price and quantity)
3. Click "Place Bid"
4. Should see success message: "Bid Placed! Your bid has been successfully submitted."
5. Check database to verify bid was created:
   ```sql
   SELECT * FROM bids WHERE buyer_id = 'user_34vzEy76jAWsF3V3TxIo2miUmJk' ORDER BY created_at DESC LIMIT 1;
   ```

## Architecture Impact

### Before (Broken)

```
Client (BidForm)
  → Supabase Client (with Clerk JWT)
  → RPC Function (rpc_create_bid)
  → auth.uid() → NULL ❌
  → Error: "Authentication required"
```

### After (Fixed)

```
Client (BidForm)
  → API Route (/api/bids/create)
  → Clerk verifies session ✅
  → Supabase Service Role Client
  → Direct database insert (bypasses RLS) ✅
  → Success!
```

## Security Considerations

✅ **Secure**:
- Clerk session verified on server (cannot be spoofed)
- Service role key never exposed to client
- Authorization check: buyerId must match authenticated user
- Input validation prevents malicious data
- Auto-user creation ensures user exists before creating bid

❌ **Important Notes**:
- Service role key stored in environment variable (`SUPABASE_SERVICE_ROLE_KEY`)
- Never log or expose this key
- Must validate user authorization for every operation
- Cannot trust client-provided user IDs without verification

## Related Issues

This fix is part of the larger Clerk + Supabase authentication workaround documented in:
- `CLERK_SUPABASE_WORKAROUND.md` - Overall authentication architecture
- `API_ROUTES.md` - API route documentation

## Next Steps

1. ✅ Test bid creation on `/buy/{eventId}` page
2. ✅ Verify asks/listings still work on `/sell/create` page (uses `/api/listings`)
3. Update tests in `__tests__/` to mock fetch instead of RPC calls
4. Add rate limiting to API routes to prevent abuse
5. Add logging/monitoring for API routes
6. Remove or protect `/api/seed` route before production

## Migration Path

If you need to revert to using RPC functions directly:

1. Fix Clerk + Supabase JWT integration (get Supabase to properly verify Clerk JWTs)
2. Revert `BidForm.tsx` to use `createBid` from `@/lib/supabase/rpc`
3. Keep API routes as alternative for server-side operations

However, the current API route approach is more flexible and maintainable.

## Lessons Learned

1. **Third-party auth with Supabase is hard**: Supabase's Clerk integration is broken/incomplete
2. **API routes are more flexible**: They give us full control over authentication and authorization
3. **Service role key is powerful**: Use with caution, always validate user identity
4. **Auto-user creation is helpful**: Eliminates the need for manual user creation step
5. **Better error messages**: API routes let us provide clear, user-friendly error messages

---

**Status**: ✅ Fixed and deployed to local dev
**Date**: November 9, 2024
**Author**: AI Assistant (with Jamie Linsdell)

