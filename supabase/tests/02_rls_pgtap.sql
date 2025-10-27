begin;
select plan(39);

-- ============================================================================
-- TEST: RLS is enabled on all tables
-- ============================================================================

select results_eq(
  $$
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    AND rowsecurity = true
    ORDER BY tablename
  $$,
  $$
    VALUES
      ('asks'::name),
      ('bids'::name),
      ('events'::name),
      ('matches'::name),
      ('tickets'::name),
      ('users'::name)
  $$,
  'RLS should be enabled on all tables'
);

-- ============================================================================
-- TEST: Policy existence for all tables
-- ============================================================================

select policies_are(
  'public',
  'users',
  ARRAY['users_select_own'],
  'users table should have expected policies'
);

select policies_are(
  'public',
  'events',
  ARRAY['events_select_all', 'events_insert_own', 'events_update_own', 'events_delete_own'],
  'events table should have expected policies'
);

select policies_are(
  'public',
  'asks',
  ARRAY['asks_select_all', 'asks_insert_own', 'asks_update_own_open', 'asks_delete_own_open'],
  'asks table should have expected policies'
);

select policies_are(
  'public',
  'bids',
  ARRAY['bids_select_all', 'bids_insert_own', 'bids_update_own_open', 'bids_delete_own_open'],
  'bids table should have expected policies'
);

select policies_are(
  'public',
  'matches',
  ARRAY['matches_select_all'],
  'matches table should have expected policies'
);

select policies_are(
  'public',
  'tickets',
  ARRAY['tickets_select_winner_or_seller'],
  'tickets table should have expected policies'
);

-- ============================================================================
-- TEST: Users can only select their own profile
-- ============================================================================

-- Set up test user context (seller from seed data)
set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111"}';

-- User can select their own profile
select isnt_empty(
  'select * from public.users where id = ''11111111-1111-1111-1111-111111111111''',
  'User should be able to select their own profile'
);

-- User cannot see other users' profiles
select is_empty(
  'select * from public.users where id = ''22222222-2222-2222-2222-222222222222''',
  'User should NOT be able to select other users profiles'
);

-- User cannot INSERT (server-side only)
prepare insert_user as
  insert into public.users (id, email, full_name)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'test@example.com', 'Test User');

select throws_ok('insert_user', '42501', null, 'User INSERT should be blocked (server-side only)');

-- User cannot UPDATE (denied)
prepare update_user as
  update public.users
  set full_name = 'Updated Name'
  where id = '11111111-1111-1111-1111-111111111111';

select throws_ok('update_user', '42501', null, 'User UPDATE should be denied');

-- ============================================================================
-- TEST: Users can create events with their own created_by
-- ============================================================================

prepare insert_own_event as
  insert into public.events (id, title, starts_at, ends_at, org, created_by)
  values (
    'eeee1111-1111-1111-1111-111111111111',
    'Test Event',
    now() + interval '1 day',
    now() + interval '2 days',
    'Test Org',
    '11111111-1111-1111-1111-111111111111'
  );

select lives_ok('insert_own_event', 'User should be able to create events with their own created_by');

prepare insert_event_as_other as
  insert into public.events (id, title, starts_at, ends_at, org, created_by)
  values (
    'eeee2222-2222-2222-2222-222222222222',
    'Fake Event',
    now() + interval '1 day',
    now() + interval '2 days',
    'Test Org',
    '99999999-9999-9999-9999-999999999999'
  );

select throws_ok('insert_event_as_other', '42501', null, 'User should NOT be able to create events as another user');

-- ============================================================================
-- TEST: Users can only update/delete their own events
-- ============================================================================

prepare update_own_event as
  update public.events
  set title = 'Updated Title'
  where id = 'eeee1111-1111-1111-1111-111111111111';

select lives_ok('update_own_event', 'User should be able to update their own event');

-- Create an event owned by another user to test restrictions
set local role postgres;
insert into public.events (id, title, starts_at, ends_at, org, created_by)
values (
  'ffff9999-9999-9999-9999-999999999999',
  'Other User Event',
  now() + interval '10 days',
  now() + interval '10 days' + interval '2 hours',
  'Other Org',
  '22222222-2222-2222-2222-222222222222'
);
reset role;

-- Back to seller user context
set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111"}';

-- Test that user cannot modify another user's event
update public.events
set title = 'Hacked Title'
where id = 'ffff9999-9999-9999-9999-999999999999';

select is(
  (select title from public.events where id = 'ffff9999-9999-9999-9999-999999999999'),
  'Other User Event',
  'User should NOT be able to update another user event (data unchanged)'
);

-- Test that user cannot delete another user's event
delete from public.events
where id = 'ffff9999-9999-9999-9999-999999999999';

select ok(
  EXISTS(select 1 from public.events where id = 'ffff9999-9999-9999-9999-999999999999'),
  'User should NOT be able to delete another user event (event still exists)'
);

-- ============================================================================
-- TEST: Users can create asks with their own seller_id
-- ============================================================================

prepare insert_own_ask as
  insert into public.asks (id, event_id, seller_id, price_cents, qty, qr_storage_path, status)
  values (
    'aaaa1111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    1000,
    1,
    'test.png',
    'open'
  );

select lives_ok('insert_own_ask', 'User should be able to create asks with their own seller_id');

prepare insert_ask_as_other as
  insert into public.asks (id, event_id, seller_id, price_cents, qty, qr_storage_path, status)
  values (
    'aaaa2222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '99999999-9999-9999-9999-999999999999',
    1000,
    1,
    'test.png',
    'open'
  );

select throws_ok('insert_ask_as_other', '42501', null, 'User should NOT be able to create asks as another user');

-- BUG TEST: User should NOT be able to insert ask with status != 'open' (currently allowed!)
prepare insert_ask_matched_status as
  insert into public.asks (id, event_id, seller_id, price_cents, qty, qr_storage_path, status)
  values (
    'aaaa9999-9999-9999-9999-999999999999',
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    1000,
    1,
    'bug_test.png',
    'matched'
  );

-- This test documents the bug - it should throw an error but currently succeeds
select throws_ok('insert_ask_matched_status', '42501', null, 'BUG: User should NOT be able to insert ask with status=matched');

-- ============================================================================
-- TEST: Users can only update/delete their own asks
-- ============================================================================

prepare update_own_ask as
  update public.asks
  set price_cents = 2000
  where id = 'aaaa1111-1111-1111-1111-111111111111';

select lives_ok('update_own_ask', 'User should be able to update their own ask');

-- Create an ask owned by another user (buyer) to test restrictions
set local role postgres;
insert into public.asks (id, event_id, seller_id, price_cents, qty, qr_storage_path, status)
values (
  'bbbbaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '33333333-3333-3333-3333-333333333333',
  '22222222-2222-2222-2222-222222222222',
  7000,
  1,
  'other_seller_qr.png',
  'open'
);
reset role;

-- Back to seller user context
set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111"}';

-- Test that user cannot modify another user's ask
update public.asks
set price_cents = 1
where id = 'bbbbaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

select is(
  (select price_cents from public.asks where id = 'bbbbaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  7000,
  'User should NOT be able to update another user ask (data unchanged)'
);

-- Test that user cannot update/delete ask with status != 'open'
set local role postgres;
insert into public.asks (id, event_id, seller_id, price_cents, qty, qr_storage_path, status)
values (
  'cccc1234-5678-1234-5678-123456789abc',
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  3000,
  1,
  'matched_ask.png',
  'matched'
);
reset role;

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111"}';

update public.asks
set price_cents = 2500
where id = 'cccc1234-5678-1234-5678-123456789abc';

select is(
  (select price_cents from public.asks where id = 'cccc1234-5678-1234-5678-123456789abc'),
  3000,
  'User should NOT be able to update ask with status != open'
);

-- Attempt to delete the matched ask (should fail silently - 0 rows affected)
delete from public.asks
where id = 'cccc1234-5678-1234-5678-123456789abc';

select ok(
  EXISTS(select 1 from public.asks where id = 'cccc1234-5678-1234-5678-123456789abc'),
  'User should NOT be able to delete ask with status != open'
);

-- ============================================================================
-- TEST: Users can create bids with their own buyer_id
-- ============================================================================

-- Switch to buyer user
set local request.jwt.claims to '{"sub": "22222222-2222-2222-2222-222222222222"}';

prepare insert_own_bid as
  insert into public.bids (id, event_id, buyer_id, price_cents, qty, status)
  values (
    'bbbb1111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222222',
    1500,
    1,
    'open'
  );

select lives_ok('insert_own_bid', 'User should be able to create bids with their own buyer_id');

prepare insert_bid_as_other as
  insert into public.bids (id, event_id, buyer_id, price_cents, qty, status)
  values (
    'bbbb2222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '99999999-9999-9999-9999-999999999999',
    1500,
    1,
    'open'
  );

select throws_ok('insert_bid_as_other', '42501', null, 'User should NOT be able to create bids as another user');

-- BUG TEST: User should NOT be able to insert bid with status != 'open' (currently allowed!)
prepare insert_bid_matched_status as
  insert into public.bids (id, event_id, buyer_id, price_cents, qty, status)
  values (
    'bbbb9999-9999-9999-9999-999999999999',
    '33333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222222',
    1500,
    1,
    'matched'
  );

-- This test documents the bug - it should throw an error but currently succeeds
select throws_ok('insert_bid_matched_status', '42501', null, 'BUG: User should NOT be able to insert bid with status=matched');

-- Test that buyer cannot update/delete bid with status != 'open'
set local role postgres;
insert into public.bids (id, event_id, buyer_id, price_cents, qty, status)
values (
  'dddd1234-5678-1234-5678-123456789abc',
  '33333333-3333-3333-3333-333333333333',
  '22222222-2222-2222-2222-222222222222',
  4000,
  1,
  'matched'
);
reset role;

set local role authenticated;
set local request.jwt.claims to '{"sub": "22222222-2222-2222-2222-222222222222"}';

update public.bids
set price_cents = 3500
where id = 'dddd1234-5678-1234-5678-123456789abc';

select is(
  (select price_cents from public.bids where id = 'dddd1234-5678-1234-5678-123456789abc'),
  4000,
  'User should NOT be able to update bid with status != open'
);

-- ============================================================================
-- TEST: Any authenticated user can see matches (market transparency)
-- ============================================================================

-- Create a match between the seeded ask (seller: 11111111) and bid (buyer: 22222222)
set local role postgres;
insert into public.matches (id, event_id, ask_id, bid_id, clearing_price_cents, qty)
values (
  'eeee1234-5678-1234-5678-123456789abc',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555',
  4750,
  1
);
reset role;

-- Switch to seller from seed data (owns ask 44444444)
set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111"}';

select isnt_empty(
  'select * from public.matches where id = ''eeee1234-5678-1234-5678-123456789abc''',
  'Seller can see matches (market transparency)'
);

-- Switch to buyer
set local request.jwt.claims to '{"sub": "22222222-2222-2222-2222-222222222222"}';

select isnt_empty(
  'select * from public.matches where id = ''eeee1234-5678-1234-5678-123456789abc''',
  'Buyer can see matches (market transparency)'
);

-- Switch to uninvolved user (should also be able to see - market transparency)
set local request.jwt.claims to '{"sub": "99999999-9999-9999-9999-999999999999"}';

select isnt_empty(
  'select * from public.matches where id = ''eeee1234-5678-1234-5678-123456789abc''',
  'Any authenticated user can see matches (market transparency)'
);

-- ============================================================================
-- TEST: Winner and seller can see tickets
-- ============================================================================

-- Create a ticket for the buyer (winner)
set local role postgres;
insert into public.tickets (id, match_id, winner_id, qr_storage_path)
values (
  'ffff1234-5678-1234-5678-123456789abc',
  'eeee1234-5678-1234-5678-123456789abc',
  '22222222-2222-2222-2222-222222222222',
  'winner_ticket.png'
);
reset role;

-- Switch to ticket winner (buyer)
set local role authenticated;
set local request.jwt.claims to '{"sub": "22222222-2222-2222-2222-222222222222"}';

select isnt_empty(
  'select * from public.tickets where id = ''ffff1234-5678-1234-5678-123456789abc''',
  'Winner should be able to see their ticket'
);

-- Switch to seller who originated the matched ask (should also be able to see)
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111"}';

select isnt_empty(
  'select * from public.tickets where id = ''ffff1234-5678-1234-5678-123456789abc''',
  'Seller who originated the matched ask should be able to see ticket'
);

-- Switch to uninvolved user (should NOT see)
set local request.jwt.claims to '{"sub": "99999999-9999-9999-9999-999999999999"}';

select is_empty(
  'select * from public.tickets where id = ''ffff1234-5678-1234-5678-123456789abc''',
  'Uninvolved user should NOT be able to see tickets'
);

-- ============================================================================
-- TEST: Anonymous users have no access
-- ============================================================================

set local role anon;

select is_empty(
  'select * from public.users',
  'Anonymous users should NOT be able to select users'
);

select is_empty(
  'select * from public.events',
  'Anonymous users should NOT be able to select events'
);

select is_empty(
  'select * from public.asks',
  'Anonymous users should NOT be able to select asks'
);

select is_empty(
  'select * from public.bids',
  'Anonymous users should NOT be able to select bids'
);

select is_empty(
  'select * from public.matches',
  'Anonymous users should NOT be able to select matches'
);

select is_empty(
  'select * from public.tickets',
  'Anonymous users should NOT be able to select tickets'
);

select * from finish();
rollback;
