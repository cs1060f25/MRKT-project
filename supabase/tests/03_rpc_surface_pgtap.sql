begin;
select plan(18);

-- ============================================================================
-- TEST: rpc_health
-- ============================================================================

-- Set authenticated context
set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111"}';

select is(
  public.rpc_health(),
  'ok',
  'rpc_health should return "ok"'
);

-- ============================================================================
-- TEST: rpc_create_event
-- ============================================================================

-- Test as seller user
prepare create_event_as_seller as
  select public.rpc_create_event(
    'Test Event via RPC',
    now() + interval '7 days',
    now() + interval '8 days',
    'Test Org RPC'
  );

select lives_ok(
  'create_event_as_seller',
  'Authenticated user should be able to create event via RPC'
);

-- Verify return type is UUID
select ok(
  (select public.rpc_create_event(
    'Another Event',
    now() + interval '14 days',
    now() + interval '15 days',
    'Org 2'
  )) IS NOT NULL,
  'rpc_create_event should return a non-null UUID'
);

-- Verify created_by is set correctly
select is(
  (select created_by from public.events where title = 'Test Event via RPC'),
  '11111111-1111-1111-1111-111111111111'::uuid,
  'rpc_create_event should set created_by to auth.uid()'
);

-- ============================================================================
-- TEST: rpc_create_ask
-- ============================================================================

-- Test as seller user (already set above)
prepare create_ask_as_seller as
  select public.rpc_create_ask(
    '33333333-3333-3333-3333-333333333333'::uuid,
    5000,
    2,
    'rpc_test_ask.png'
  );

select lives_ok(
  'create_ask_as_seller',
  'Authenticated user should be able to create ask via RPC'
);

-- Verify return type is UUID
select ok(
  (select public.rpc_create_ask(
    '33333333-3333-3333-3333-333333333333'::uuid,
    6000,
    1,
    'another_ask.png'
  )) IS NOT NULL,
  'rpc_create_ask should return a non-null UUID'
);

-- Verify seller_id and status are set correctly
select is(
  (select seller_id from public.asks where price_cents = 5000 and qr_storage_path = 'rpc_test_ask.png'),
  '11111111-1111-1111-1111-111111111111'::uuid,
  'rpc_create_ask should set seller_id to auth.uid()'
);

select is(
  (select status from public.asks where price_cents = 5000 and qr_storage_path = 'rpc_test_ask.png'),
  'open',
  'rpc_create_ask should set status to open'
);

-- ============================================================================
-- TEST: rpc_create_bid
-- ============================================================================

-- Switch to buyer user
set local request.jwt.claims to '{"sub": "22222222-2222-2222-2222-222222222222"}';

prepare create_bid_as_buyer as
  select public.rpc_create_bid(
    '33333333-3333-3333-3333-333333333333'::uuid,
    4500,
    3
  );

select lives_ok(
  'create_bid_as_buyer',
  'Authenticated user should be able to create bid via RPC'
);

-- Verify return type is UUID
select ok(
  (select public.rpc_create_bid(
    '33333333-3333-3333-3333-333333333333'::uuid,
    4800,
    1
  )) IS NOT NULL,
  'rpc_create_bid should return a non-null UUID'
);

-- Verify buyer_id and status are set correctly
select is(
  (select buyer_id from public.bids where price_cents = 4500 and qty = 3),
  '22222222-2222-2222-2222-222222222222'::uuid,
  'rpc_create_bid should set buyer_id to auth.uid()'
);

select is(
  (select status from public.bids where price_cents = 4500 and qty = 3),
  'open',
  'rpc_create_bid should set status to open'
);

-- ============================================================================
-- TEST: rpc_get_book
-- ============================================================================

-- Any authenticated user can call rpc_get_book (market transparency)
prepare get_book_for_event as
  select * from public.rpc_get_book('33333333-3333-3333-3333-333333333333'::uuid);

select lives_ok(
  'get_book_for_event',
  'Authenticated user should be able to get book via RPC'
);

-- Verify the book contains both asks and bids
select ok(
  EXISTS(
    select 1 from public.rpc_get_book('33333333-3333-3333-3333-333333333333'::uuid)
    where book_side = 'ask'
  ),
  'rpc_get_book should return ask side'
);

select ok(
  EXISTS(
    select 1 from public.rpc_get_book('33333333-3333-3333-3333-333333333333'::uuid)
    where book_side = 'bid'
  ),
  'rpc_get_book should return bid side'
);

-- Verify aggregation (we created multiple orders at same price)
-- We have seed data: 1 ask at 5000 cents, 1 bid at 5000 cents
-- Plus RPC created: asks at 5000 and 6000, bids at 4500 and 4800
select ok(
  (select qty from public.rpc_get_book('33333333-3333-3333-3333-333333333333'::uuid)
   where book_side = 'ask' and price_cents = 5000) >= 2,
  'rpc_get_book should aggregate multiple asks at same price'
);

-- ============================================================================
-- TEST: rpc_mark_ticket_delivered
-- ============================================================================

-- Create a match and ticket for testing (as postgres superuser)
set local role postgres;
insert into public.matches (id, event_id, ask_id, bid_id, clearing_price_cents, qty)
values (
  'aaaabbbb-cccc-dddd-eeee-ffff00001111',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555',
  5000,
  1
);

insert into public.tickets (id, match_id, winner_id, qr_storage_path)
values (
  'bbbbcccc-dddd-eeee-ffff-000011112222',
  'aaaabbbb-cccc-dddd-eeee-ffff00001111',
  '22222222-2222-2222-2222-222222222222',
  'rpc_test_ticket.png'
);
reset role;

-- Test as winner (buyer)
set local role authenticated;
set local request.jwt.claims to '{"sub": "22222222-2222-2222-2222-222222222222"}';

select lives_ok(
  $$select public.rpc_mark_ticket_delivered('bbbbcccc-dddd-eeee-ffff-000011112222'::uuid)$$,
  'Winner should be able to mark ticket as delivered'
);

-- Verify delivered_at was set
select ok(
  (select delivered_at from public.tickets where id = 'bbbbcccc-dddd-eeee-ffff-000011112222') IS NOT NULL,
  'rpc_mark_ticket_delivered should set delivered_at timestamp'
);

select * from finish();
rollback;
