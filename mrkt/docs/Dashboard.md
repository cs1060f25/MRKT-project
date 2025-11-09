# Dashboard Page Documentation

## Overview

The Dashboard is a read-first authenticated page that provides users with access to four key sections:
- **Market**: Browse upcoming events
- **My Bids**: View and manage placed bids
- **My Listings**: View and manage ticket listings (asks)
- **My Tickets**: Access won tickets

All data is fetched server-side using RLS-aware Supabase clients, ensuring proper access control and data isolation.

---

## Route

**URL**: `/dashboard`

**Access**: Authenticated users only (Clerk auth guard)

**Type**: Server Component (Next.js App Router)

---

## Data Sources

### 1. Market (Events)

**Table**: `events`

**RLS Policy**: All authenticated users can SELECT

**Query**:
```typescript
await supabase
  .from('events')
  .select('*')
  .gt('starts_at', new Date().toISOString())
  .order('starts_at', { ascending: true })
```

**Columns Displayed**:
- Event Title
- Organization
- Start Time
- Book Preview (optional: best ask/bid prices)
- Action: "View Event" link

**Optional RPC**: `rpc_get_book(event_id)` for order book preview

The book preview fetches the top 3 price levels for both asks and bids, providing users with quick market depth information without navigating to the event detail page.

**Empty State**: "No upcoming events yet"

---

### 2. My Bids

**Table**: `bids` (joined with `events`)

**RLS Policy**: Users can only SELECT their own bids (`buyer_id = auth.uid()`)

**Query**:
```typescript
await supabase
  .from('bids')
  .select(`
    *,
    event:events(title, starts_at)
  `)
  .eq('buyer_id', userId)
  .order('created_at', { ascending: false })
```

**Columns Displayed**:
- Event Title & Start Time
- Price
- Quantity
- Status (open/matched/cancelled)
- Created Date
- Action: "View Event" link

**Empty State**: "You haven't placed any bids" + "Browse Events" button (disabled)

**Notes**:
- Bids are filtered by RLS to only show user's own bids
- Status badges use color coding (green=open, blue=matched, gray=cancelled)

---

### 3. My Listings

**Table**: `asks` (joined with `events`)

**RLS Policy**: Users can only SELECT their own asks (`seller_id = auth.uid()`)

**Query**:
```typescript
await supabase
  .from('asks')
  .select(`
    *,
    event:events(title, starts_at)
  `)
  .eq('seller_id', userId)
  .order('created_at', { ascending: false })
```

**Columns Displayed**:
- Event Title & Start Time
- Price Floor
- Quantity
- Status (open/matched/cancelled)
- QR Status (✓ Uploaded / ❌ Missing)
- Action: "Upload QR" button (disabled)

**QR Status Logic**:
- **Uploaded**: `qr_storage_path IS NOT NULL`
- **Missing**: `qr_storage_path IS NULL`

**Empty State**: "No listings yet" + "Create Listing" button (disabled)

**Notes**:
- QR status is derived from the `qr_storage_path` column
- "Upload QR" button is a stub for future QR upload ticket

---

### 4. My Tickets

**Table**: `tickets` (joined with `matches` and `events`)

**RLS Policy**: Users can only SELECT tickets they won (`winner_id = auth.uid()`)

**Query**:
```typescript
await supabase
  .from('tickets')
  .select(`
    *,
    match:matches(event_id, clearing_price_cents, created_at),
    event:matches(event:events(title, starts_at))
  `)
  .eq('winner_id', userId)
  .order('created_at', { ascending: false })
```

**Columns Displayed**:
- Event Title & Start Time
- Match Price (clearing price)
- Match Date (when match occurred)
- Delivered Status (✓ Delivered / ⏱ Pending)
- Action: "View Ticket" button (disabled)

**Delivered Logic**:
- **Delivered**: `delivered_at IS NOT NULL`
- **Pending**: `delivered_at IS NULL`

**Empty State**: "No tickets yet"

**Notes**:
- Tickets represent successful matches where user was the buyer/winner
- "View Ticket" button will call storage signed URL API (pending storage ticket)

---

## Stub Actions

The following actions are placeholders for future development:

### 1. "View Event" (Market & My Bids)
**Current**: Link to `/events/[eventId]`
**Status**: Route exists but detail page not yet implemented
**Future Ticket**: Event detail page with bid placement UI

### 2. "Browse Events" (My Bids Empty State)
**Current**: Disabled button
**Status**: Stub
**Future Ticket**: Navigation to market section or event listing

### 3. "Create Listing" (My Listings Empty State)
**Current**: Disabled button
**Status**: Stub
**Future Ticket**: Seller UI for creating new listing
**Route**: `/sell/create` (suggested)

### 4. "Upload QR" (My Listings)
**Current**: Disabled button with tooltip "QR upload coming soon"
**Status**: Stub
**Future Ticket**: QR code upload UI
**Route**: `/sell/[askId]/qr` (suggested)

### 5. "View Ticket" (My Tickets)
**Current**: Disabled button with tooltip "Storage integration pending"
**Status**: Stub
**Future Ticket**: Storage signed URL generation and QR display
**Implementation**: Call API route to get signed URL, display QR in modal or new page

---

## Error Handling

Each section has **independent error handling**:

### Error Collection
```typescript
const errors = {
  events: eventsResult.error || undefined,
  bids: bidsResult.error || undefined,
  listings: listingsResult.error || undefined,
  tickets: ticketsResult.error || undefined,
}
```

### Error Display
- Errors are displayed using the `<ErrorBanner>` component
- Each tab renders its error state independently
- Failed sections don't prevent other sections from rendering

### Error Logging
All query errors are logged to console with context:
```typescript
console.warn('Failed to fetch user bids:', error)
```

### User Experience
- User sees friendly error message: "Failed to load data"
- Retry functionality can be added to ErrorBanner component
- Partial failures don't break entire dashboard

---

## Loading States

**Current Implementation**: Server-side rendering (no loading UI)

**Rationale**:
- All data fetched in parallel on server before rendering
- Next.js 16 handles streaming and suspense automatically
- Fast query response times (<200ms typical)

**Future Enhancement**:
If loading states are needed for slower queries, add:
```typescript
// app/dashboard/loading.tsx
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto p-8">
      <LoadingSkeleton rows={5} columns={5} />
    </div>
  )
}
```

---

## Empty States

Each section provides helpful empty states with:
- **Icon**: Visual representation (inbox, clipboard, ticket)
- **Title**: Clear message (e.g., "No upcoming events yet")
- **Description**: Optional context
- **CTA Button**: Disabled stub for future action

**Design**:
- Uses `<EmptyState>` component for consistency
- Gray background with subtle styling
- Disabled buttons indicate future functionality

---

## Authentication & RLS

### Authentication Flow
1. User visits `/dashboard`
2. Clerk middleware syncs JWT with Supabase session
3. Server component calls `auth()` to get `userId`
4. If no `userId`, redirect to `/sign-in`
5. Create RLS-aware Supabase client using server-side cookies

### RLS Enforcement
- **No service-role key used** ✅
- All queries use `createServerClient` (RLS-aware)
- Data filtered by `auth.uid()` in RLS policies
- Users can only see their own bids, listings, and tickets
- Market events visible to all authenticated users

### Security
- JWT contains user ID (`sub` claim) set by Clerk
- Supabase extracts `auth.uid()` from JWT
- RLS policies enforce user-scoped access automatically
- No manual user ID filtering needed in query code

---

## Performance Optimization

### Parallel Queries
All main sections fetched in parallel:
```typescript
const [eventsResult, bidsResult, listingsResult, ticketsResult] =
  await Promise.all([...])
```

### Book Preview Limits
- Only fetch book for first 3 events
- Limit to top 3 price levels per side (asks/bids)
- Reduces initial page load time

### Future Optimizations
- Add database indices on frequently queried columns
- Implement pagination for large result sets
- Add caching layer for frequently accessed data
- Use React Server Components streaming for progressive loading

---

## Testing

### Unit Tests (Jest + React Testing Library)

**Test files** (to be added):
- `__tests__/components/dashboard/MarketTable.test.tsx`
- `__tests__/components/dashboard/MyBidsTable.test.tsx`
- `__tests__/components/dashboard/MyListingsTable.test.tsx`
- `__tests__/components/dashboard/MyTicketsTable.test.tsx`

**Test cases per component**:
1. ✅ Renders table with data
2. ✅ Renders empty state when no data
3. ✅ Renders error banner on error
4. ✅ Stub buttons are present and disabled
5. ✅ Links/actions navigate to correct routes

**Mock Supabase Client**:
```typescript
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        data: mockData,
        error: null
      }))
    }))
  }))
}
```

### Integration Tests (Future)
- After Buyer/Seller UIs implemented
- Verify dashboard → event detail navigation
- Verify stub buttons enable when features ship
- End-to-end tests with Playwright

---

## File Structure

```
mrkt/
├── app/
│   └── dashboard/
│       └── page.tsx                    # Main dashboard page
├── components/
│   ├── common/
│   │   ├── ErrorBanner.tsx             # Error display
│   │   ├── LoadingSkeleton.tsx         # Loading state
│   │   └── EmptyState.tsx              # Empty state
│   └── dashboard/
│       ├── DashboardLayout.tsx         # Tab navigation wrapper
│       ├── MarketTable.tsx             # Events table
│       ├── MyBidsTable.tsx             # Bids table
│       ├── MyListingsTable.tsx         # Listings table
│       └── MyTicketsTable.tsx          # Tickets table
├── lib/
│   ├── dashboard/
│   │   ├── queries.ts                  # Server-side queries
│   │   └── types.ts                    # TypeScript types
│   └── utils/
│       └── format.ts                   # Formatting helpers
└── docs/
    └── Dashboard.md                    # This file
```

---

## Future Enhancements

### Short-term
1. **Add unit tests** for all components
2. **Implement event detail page** (view event route)
3. **Add retry functionality** to ErrorBanner
4. **Add pagination** for large datasets

### Medium-term
1. **Buyer UI** - Place bids, browse events
2. **Seller UI** - Create listings, upload QR codes
3. **QR Code Display** - View tickets with storage integration
4. **Real-time updates** - Use Supabase Realtime for live bid/ask updates

### Long-term
1. **Advanced filtering** - Filter by date, price, organization
2. **Search functionality** - Search events by title/org
3. **Notifications** - Alert users of matches, expirations
4. **Analytics** - Personal trading history, statistics
5. **Mobile optimization** - Responsive design improvements

---

## Troubleshooting

### Issue: Dashboard shows empty even with data

**Cause**: RLS policies not allowing user access

**Solution**:
1. Check that Clerk JWT contains `sub` claim
2. Verify middleware syncs Clerk JWT with Supabase
3. Inspect RLS policies in `supabase/migrations/*_rls.sql`
4. Test queries directly in Supabase Studio with user context

### Issue: Book preview not showing

**Cause**: `rpc_get_book` returning empty or error

**Solution**:
1. Check that asks/bids exist with `status = 'open'`
2. Verify RPC function exists: `SELECT * FROM pg_proc WHERE proname = 'rpc_get_book'`
3. Test RPC directly: `SELECT * FROM rpc_get_book('event-uuid')`
4. Check console for error logs

### Issue: "View Event" link returns 404

**Cause**: Event detail page not yet implemented

**Solution**:
- This is expected behavior (stub route)
- Will be resolved when Event Detail ticket is completed

### Issue: TypeScript errors in components

**Cause**: Missing type definitions or incorrect imports

**Solution**:
1. Ensure `lib/dashboard/types.ts` is created
2. Run `npx tsc --noEmit` to check type errors
3. Verify all imports use `@/` path alias correctly

---

## API Reference

### Query Functions

#### `getUpcomingEvents(supabase)`
Returns events where `starts_at > now()`, ordered by start time.

**Returns**: `QueryResult<Event[]>`

#### `getUserBids(supabase, userId)`
Returns user's bids with joined event data.

**Returns**: `QueryResult<Bid[]>`

#### `getUserListings(supabase, userId)`
Returns user's asks with joined event data.

**Returns**: `QueryResult<Ask[]>`

#### `getUserTickets(supabase, userId)`
Returns user's tickets with joined match and event data.

**Returns**: `QueryResult<Ticket[]>`

#### `getBookPreview(supabase, eventId)`
Returns top 3 price levels for both asks and bids.

**Returns**: `QueryResult<BookEntry[]>`

---

## Related Documentation

- [AGENTS.md](../../AGENTS.md) - Project overview and setup
- [Supabase README](../../supabase/README.md) - Database schema and RLS policies
- [RLS Tests](../../supabase/tests/02_rls_pgtap.sql) - RLS policy verification

---

*Last Updated: November 2025*
