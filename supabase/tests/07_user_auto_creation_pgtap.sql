begin;
select plan(13);

-- ============================================================================
-- TEST: ensure_user_exists function
-- ============================================================================

-- Test: Create new user via ensure_user_exists
select lives_ok(
  $$select public.ensure_user_exists('user_test_001', 'test@example.com')$$,
  'ensure_user_exists should create new user'
);

-- Verify user was created
select is(
  (select count(*) from public.users where id = 'user_test_001'),
  1::bigint,
  'User should exist in users table'
);

select is(
  (select email from public.users where id = 'user_test_001'),
  'test@example.com',
  'User email should be set correctly'
);

-- Test: Idempotent - calling again with same user ID should not error
select lives_ok(
  $$select public.ensure_user_exists('user_test_001', 'different@example.com')$$,
  'ensure_user_exists should be idempotent'
);

-- Verify user data unchanged (ON CONFLICT DO NOTHING)
select is(
  (select email from public.users where id = 'user_test_001'),
  'test@example.com',
  'User email should remain unchanged on conflict'
);

-- Test: Create user without email (nullable)
select lives_ok(
  $$select public.ensure_user_exists('user_test_002')$$,
  'ensure_user_exists should work without email'
);

select is(
  (select email from public.users where id = 'user_test_002'),
  NULL,
  'User email should be NULL when not provided'
);

-- ============================================================================
-- TEST: rpc_create_bid auto-creates buyer
-- ============================================================================

-- Create user and event for testing (as postgres)
set local role postgres;

-- Create user for the event creator first (required by FK)
insert into public.users (id, email, full_name, created_at)
values ('test_creator_001', 'creator@test.com', 'Test Creator', now());

-- Create event
insert into public.events (id, title, starts_at, ends_at, org, created_by)
values (
  'aaaaaaaa-bbbb-cccc-dddd-000000000001'::uuid,
  'Bid Test Event',
  now() + interval '1 day',
  now() + interval '2 days',
  'Test Org',
  'test_creator_001'
);

reset role;

-- Test: Create bid with new buyer_id - should auto-create user
set local role authenticated;
set local request.jwt.claims to '{"sub": "bid_buyer_new_001"}';

select ok(
  (select public.rpc_create_bid(
    'aaaaaaaa-bbbb-cccc-dddd-000000000001'::uuid,
    5000,
    2,
    'bid_buyer_new_001'
  )) IS NOT NULL,
  'rpc_create_bid should succeed with new buyer_id'
);

-- Verify buyer was auto-created
select is(
  (select count(*) from public.users where id = 'bid_buyer_new_001'),
  1::bigint,
  'Buyer should be auto-created in users table'
);

-- Test: Create another bid with existing buyer_id - should not duplicate
select ok(
  (select public.rpc_create_bid(
    'aaaaaaaa-bbbb-cccc-dddd-000000000001'::uuid,
    5500,
    1,
    'bid_buyer_new_001'
  )) IS NOT NULL,
  'rpc_create_bid should succeed with existing buyer_id'
);

-- Verify buyer not duplicated
select is(
  (select count(*) from public.users where id = 'bid_buyer_new_001'),
  1::bigint,
  'Buyer should not be duplicated'
);

-- ============================================================================
-- TEST: rpc_create_ask auto-creates seller
-- ============================================================================

-- Test: Create ask with new seller_id - should auto-create user
set local request.jwt.claims to '{"sub": "ask_seller_new_001"}';

select ok(
  (select public.rpc_create_ask(
    'aaaaaaaa-bbbb-cccc-dddd-000000000001'::uuid,
    6000,
    3,
    'test_qr_path.png',
    'ask_seller_new_001'
  )) IS NOT NULL,
  'rpc_create_ask should succeed with new seller_id'
);

-- Verify seller was auto-created
select is(
  (select count(*) from public.users where id = 'ask_seller_new_001'),
  1::bigint,
  'Seller should be auto-created in users table'
);

select * from finish();
rollback;
