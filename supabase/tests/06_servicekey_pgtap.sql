begin;
select plan(11);

-- ============================================================================
-- TEST: Service Role Key Integration
-- These tests verify that the service-role key properly bypasses RLS
-- while regular authenticated users are still subject to RLS policies.
--
-- Context:
-- - Anon/Authenticated users: Subject to RLS, limited to their own data
-- - Service role: Bypasses RLS, full database access for system operations
-- ============================================================================

-- ============================================================================
-- TEST: Authenticated user cannot insert into matches (RLS blocks)
-- ============================================================================

-- Set up as regular authenticated user (seller from seed data)
set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111"}';

-- Attempt to insert a match (should fail - no INSERT policy for authenticated users)
prepare authenticated_insert_match as
  INSERT INTO public.matches (id, event_id, ask_id, bid_id, clearing_price_cents, qty)
  VALUES (
    'aaaa0001-0001-0001-0001-000000000001',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444',
    '55555555-5555-5555-5555-555555555555',
    5000,
    1
  );

select throws_ok(
  'authenticated_insert_match',
  '42501', -- Permission denied
  null,
  'Authenticated user should NOT be able to insert into matches (RLS blocks)'
);

-- ============================================================================
-- TEST: Authenticated user cannot update tickets of others
-- ============================================================================

-- Create a match and ticket as postgres (for testing)
set local role postgres;

-- First create a match
INSERT INTO public.matches (id, event_id, ask_id, bid_id, clearing_price_cents, qty)
VALUES (
  'eeee1234-5678-1234-5678-123456789abc',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555',
  5000,
  1
);

-- Then create a ticket for that match
INSERT INTO public.tickets (id, match_id, winner_id, qr_storage_path)
VALUES (
  'aaaa0002-0002-0002-0002-000000000002',
  'eeee1234-5678-1234-5678-123456789abc',
  '22222222-2222-2222-2222-222222222222', -- Buyer is the winner
  'test_path.png'
);
reset role;

-- Switch to a different user who has no relationship to this ticket
set local role authenticated;
set local request.jwt.claims to '{"sub": "99999999-9999-9999-9999-999999999999"}';

-- Attempt to update another user's ticket
UPDATE public.tickets
SET delivered_at = now()
WHERE id = 'aaaa0002-0002-0002-0002-000000000002';

-- Verify the update did NOT happen (RLS prevented it - uninvolved user)
select is(
  (SELECT delivered_at FROM public.tickets WHERE id = 'aaaa0002-0002-0002-0002-000000000002'),
  NULL,
  'Uninvolved user should NOT be able to update other users tickets (RLS blocks)'
);

-- ============================================================================
-- TEST: Service role can insert into matches (bypasses RLS)
-- ============================================================================

-- Switch to postgres role (simulates service-role in practice)
-- In production, service-role key would be used via Supabase client
set local role postgres;

prepare service_insert_match as
  INSERT INTO public.matches (id, event_id, ask_id, bid_id, clearing_price_cents, qty)
  VALUES (
    'aaaa0003-0003-0003-0003-000000000003',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444',
    '55555555-5555-5555-5555-555555555555',
    4800,
    1
  );

select lives_ok(
  'service_insert_match',
  'Service role should be able to insert into matches (bypasses RLS)'
);

-- Verify the match was created
select ok(
  EXISTS(SELECT 1 FROM public.matches WHERE id = 'aaaa0003-0003-0003-0003-000000000003'),
  'Match inserted by service role should exist in database'
);

-- ============================================================================
-- TEST: Service role can insert into tickets (bypasses RLS)
-- ============================================================================

prepare service_insert_ticket as
  INSERT INTO public.tickets (id, match_id, winner_id, qr_storage_path)
  VALUES (
    'aaaa0004-0004-0004-0004-000000000004',
    'aaaa0003-0003-0003-0003-000000000003', -- Match just created
    '22222222-2222-2222-2222-222222222222',
    'service_qr.png'
  );

select lives_ok(
  'service_insert_ticket',
  'Service role should be able to insert into tickets (bypasses RLS)'
);

-- ============================================================================
-- TEST: Service role can update any user's data (bypasses RLS)
-- ============================================================================

-- Update a ticket that belongs to buyer (22222222...)
UPDATE public.tickets
SET delivered_at = now()
WHERE id = 'aaaa0002-0002-0002-0002-000000000002';

-- Verify the update succeeded
select ok(
  (SELECT delivered_at FROM public.tickets WHERE id = 'aaaa0002-0002-0002-0002-000000000002') IS NOT NULL,
  'Service role should be able to update any users data (bypasses RLS)'
);

-- ============================================================================
-- TEST: Service role can read all data regardless of ownership
-- ============================================================================

-- Service role should see ALL tickets, not just for a specific user
select ok(
  (SELECT COUNT(*) FROM public.tickets) >= 2, -- At least the 2 we created
  'Service role should be able to read all tickets (bypasses RLS)'
);

-- Service role should see ALL matches
select ok(
  (SELECT COUNT(*) FROM public.matches) >= 1,
  'Service role should be able to read all matches (bypasses RLS)'
);

-- ============================================================================
-- TEST: Service role can execute privileged RPCs
-- ============================================================================

-- Test that service role can call RPC (using rpc_get_book as it's read-only)
prepare service_call_rpc as
  SELECT public.rpc_get_book('33333333-3333-3333-3333-333333333333'::uuid);

select lives_ok(
  'service_call_rpc',
  'Service role should be able to execute RPC functions'
);

-- ============================================================================
-- TEST: Verify current role is postgres (simulating service-role)
-- ============================================================================

select is(
  current_setting('role'),
  'postgres',
  'Current role should be postgres (simulating service-role privileges)'
);

-- ============================================================================
-- TEST: Regular user still subject to RLS after service role operations
-- ============================================================================

-- Switch back to authenticated user
set local role authenticated;
set local request.jwt.claims to '{"sub": "99999999-9999-9999-9999-999999999999"}'; -- Different user

-- This user should NOT see the matches created by service role
-- (matches table has SELECT policy that allows all authenticated, but for demonstration)
-- They should NOT be able to insert into matches
prepare user_insert_match_after_service as
  INSERT INTO public.matches (id, event_id, ask_id, bid_id, clearing_price_cents, qty)
  VALUES (
    'aaaa0005-0005-0005-0005-000000000005',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444',
    '55555555-5555-5555-5555-555555555555',
    4500,
    1
  );

select throws_ok(
  'user_insert_match_after_service',
  '42501',
  null,
  'Regular users still subject to RLS even after service role operations'
);

select * from finish();
rollback;
