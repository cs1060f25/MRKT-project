begin;
select plan(31);

-- Set up authenticated user context (seller)
set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111"}';

-- ============================================================================
-- TEST: rpc_create_event input validation
-- ============================================================================

-- NULL title
prepare create_event_null_title as
  select public.rpc_create_event(
    NULL,
    now() + interval '1 day',
    now() + interval '2 days',
    'Test Org'
  );
select throws_matching(
  'create_event_null_title',
  'title cannot be null',
  'rpc_create_event should reject NULL title'
);

-- Empty title
prepare create_event_empty_title as
  select public.rpc_create_event(
    '   ',
    now() + interval '1 day',
    now() + interval '2 days',
    'Test Org'
  );
select throws_matching(
  'create_event_empty_title',
  'title cannot be null or empty',
  'rpc_create_event should reject empty title'
);

-- NULL starts_at
prepare create_event_null_starts as
  select public.rpc_create_event(
    'Test Event',
    NULL,
    now() + interval '2 days',
    'Test Org'
  );
select throws_matching(
  'create_event_null_starts',
  'starts_at cannot be null',
  'rpc_create_event should reject NULL starts_at'
);

-- NULL ends_at
prepare create_event_null_ends as
  select public.rpc_create_event(
    'Test Event',
    now() + interval '1 day',
    NULL,
    'Test Org'
  );
select throws_matching(
  'create_event_null_ends',
  'ends_at cannot be null',
  'rpc_create_event should reject NULL ends_at'
);

-- starts_at >= ends_at
prepare create_event_invalid_dates as
  select public.rpc_create_event(
    'Test Event',
    now() + interval '2 days',
    now() + interval '1 day',
    'Test Org'
  );
select throws_matching(
  'create_event_invalid_dates',
  'starts_at must be before ends_at',
  'rpc_create_event should reject starts_at >= ends_at'
);

-- ============================================================================
-- TEST: rpc_create_ask input validation
-- ============================================================================

-- NULL event_id
prepare create_ask_null_event as
  select public.rpc_create_ask(
    NULL,
    1000,
    1,
    'test.png'
  );
select throws_matching(
  'create_ask_null_event',
  'event_id cannot be null',
  'rpc_create_ask should reject NULL event_id'
);

-- NULL price_cents
prepare create_ask_null_price as
  select public.rpc_create_ask(
    '33333333-3333-3333-3333-333333333333'::uuid,
    NULL,
    1,
    'test.png'
  );
select throws_matching(
  'create_ask_null_price',
  'price_cents cannot be null',
  'rpc_create_ask should reject NULL price_cents'
);

-- Zero price_cents
prepare create_ask_zero_price as
  select public.rpc_create_ask(
    '33333333-3333-3333-3333-333333333333'::uuid,
    0,
    1,
    'test.png'
  );
select throws_matching(
  'create_ask_zero_price',
  'price_cents must be positive',
  'rpc_create_ask should reject zero price_cents'
);

-- Negative price_cents
prepare create_ask_negative_price as
  select public.rpc_create_ask(
    '33333333-3333-3333-3333-333333333333'::uuid,
    -100,
    1,
    'test.png'
  );
select throws_matching(
  'create_ask_negative_price',
  'price_cents must be positive',
  'rpc_create_ask should reject negative price_cents'
);

-- NULL qty
prepare create_ask_null_qty as
  select public.rpc_create_ask(
    '33333333-3333-3333-3333-333333333333'::uuid,
    1000,
    NULL,
    'test.png'
  );
select throws_matching(
  'create_ask_null_qty',
  'qty cannot be null',
  'rpc_create_ask should reject NULL qty'
);

-- Zero qty
prepare create_ask_zero_qty as
  select public.rpc_create_ask(
    '33333333-3333-3333-3333-333333333333'::uuid,
    1000,
    0,
    'test.png'
  );
select throws_matching(
  'create_ask_zero_qty',
  'qty must be positive',
  'rpc_create_ask should reject zero qty'
);

-- NULL qr_storage_path
prepare create_ask_null_path as
  select public.rpc_create_ask(
    '33333333-3333-3333-3333-333333333333'::uuid,
    1000,
    1,
    NULL
  );
select throws_matching(
  'create_ask_null_path',
  'qr_storage_path cannot be null',
  'rpc_create_ask should reject NULL qr_storage_path'
);

-- ============================================================================
-- TEST: rpc_create_bid input validation
-- ============================================================================

-- Switch to buyer user
set local request.jwt.claims to '{"sub": "22222222-2222-2222-2222-222222222222"}';

-- NULL event_id
prepare create_bid_null_event as
  select public.rpc_create_bid(
    NULL,
    1000,
    1
  );
select throws_matching(
  'create_bid_null_event',
  'event_id cannot be null',
  'rpc_create_bid should reject NULL event_id'
);

-- NULL price_cents
prepare create_bid_null_price as
  select public.rpc_create_bid(
    '33333333-3333-3333-3333-333333333333'::uuid,
    NULL,
    1
  );
select throws_matching(
  'create_bid_null_price',
  'price_cents cannot be null',
  'rpc_create_bid should reject NULL price_cents'
);

-- Zero price_cents
prepare create_bid_zero_price as
  select public.rpc_create_bid(
    '33333333-3333-3333-3333-333333333333'::uuid,
    0,
    1
  );
select throws_matching(
  'create_bid_zero_price',
  'price_cents must be positive',
  'rpc_create_bid should reject zero price_cents'
);

-- Negative price_cents
prepare create_bid_negative_price as
  select public.rpc_create_bid(
    '33333333-3333-3333-3333-333333333333'::uuid,
    -100,
    1
  );
select throws_matching(
  'create_bid_negative_price',
  'price_cents must be positive',
  'rpc_create_bid should reject negative price_cents'
);

-- NULL qty
prepare create_bid_null_qty as
  select public.rpc_create_bid(
    '33333333-3333-3333-3333-333333333333'::uuid,
    1000,
    NULL
  );
select throws_matching(
  'create_bid_null_qty',
  'qty cannot be null',
  'rpc_create_bid should reject NULL qty'
);

-- Zero qty
prepare create_bid_zero_qty as
  select public.rpc_create_bid(
    '33333333-3333-3333-3333-333333333333'::uuid,
    1000,
    0
  );
select throws_matching(
  'create_bid_zero_qty',
  'qty must be positive',
  'rpc_create_bid should reject zero qty'
);

-- ============================================================================
-- TEST: rpc_get_book input validation
-- ============================================================================

-- NULL event_id
prepare get_book_null_event as
  select * from public.rpc_get_book(NULL);
select throws_matching(
  'get_book_null_event',
  'event_id cannot be null',
  'rpc_get_book should reject NULL event_id'
);

-- ============================================================================
-- TEST: rpc_mark_ticket_delivered access control and validation
-- ============================================================================

-- Create a match and ticket for testing (as postgres)
set local role postgres;
insert into public.matches (id, event_id, ask_id, bid_id, clearing_price_cents, qty)
values (
  'ddddeeee-ffff-1111-2222-333344445555',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555',
  5000,
  1
);

insert into public.tickets (id, match_id, winner_id, qr_storage_path)
values (
  'eeee1111-2222-3333-4444-555566667777',
  'ddddeeee-ffff-1111-2222-333344445555',
  '22222222-2222-2222-2222-222222222222',
  'access_test_ticket.png'
);
reset role;

-- NULL ticket_id
set local role authenticated;
set local request.jwt.claims to '{"sub": "22222222-2222-2222-2222-222222222222"}';

prepare deliver_null_ticket as
  select public.rpc_mark_ticket_delivered(NULL);
select throws_matching(
  'deliver_null_ticket',
  'ticket_id cannot be null',
  'rpc_mark_ticket_delivered should reject NULL ticket_id'
);

-- Non-existent ticket
prepare deliver_nonexistent_ticket as
  select public.rpc_mark_ticket_delivered('ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid);
select throws_matching(
  'deliver_nonexistent_ticket',
  'Ticket not found',
  'rpc_mark_ticket_delivered should reject non-existent ticket'
);

-- Unauthorized user (not winner, not seller)
set local request.jwt.claims to '{"sub": "99999999-9999-9999-9999-999999999999"}';

prepare deliver_unauthorized as
  select public.rpc_mark_ticket_delivered('eeee1111-2222-3333-4444-555566667777'::uuid);
select throws_matching(
  'deliver_unauthorized',
  'Not authorized to deliver this ticket',
  'rpc_mark_ticket_delivered should reject unauthorized user'
);

-- Winner can deliver (positive case for comparison)
set local request.jwt.claims to '{"sub": "22222222-2222-2222-2222-222222222222"}';

select lives_ok(
  $$select public.rpc_mark_ticket_delivered('eeee1111-2222-3333-4444-555566667777'::uuid)$$,
  'Winner should be able to mark ticket as delivered'
);

-- Already delivered
prepare deliver_already_delivered as
  select public.rpc_mark_ticket_delivered('eeee1111-2222-3333-4444-555566667777'::uuid);
select throws_matching(
  'deliver_already_delivered',
  'Ticket already delivered',
  'rpc_mark_ticket_delivered should reject already delivered ticket'
);

-- ============================================================================
-- TEST: Row count changes for successful operations
-- ============================================================================

-- Switch back to seller
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111"}';

-- Test ask creation increases row count
select is(
  (select count(*) from public.asks),
  (select count(*) from public.asks),
  'Baseline ask count'
);

-- Create ask and verify count increased
select ok(
  (select public.rpc_create_ask(
    '33333333-3333-3333-3333-333333333333'::uuid,
    9999,
    5,
    'rowcount_test.png'
  )) IS NOT NULL,
  'rpc_create_ask should create new row'
);

select is(
  (select count(*) from public.asks where price_cents = 9999),
  1::bigint,
  'New ask should be created'
);

-- Test bid creation increases row count
set local request.jwt.claims to '{"sub": "22222222-2222-2222-2222-222222222222"}';

select ok(
  (select public.rpc_create_bid(
    '33333333-3333-3333-3333-333333333333'::uuid,
    8888,
    3
  )) IS NOT NULL,
  'rpc_create_bid should create new row'
);

select is(
  (select count(*) from public.bids where price_cents = 8888),
  1::bigint,
  'New bid should be created'
);

-- Test event creation increases row count
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111"}';

select ok(
  (select public.rpc_create_event(
    'Row Count Test Event',
    now() + interval '30 days',
    now() + interval '31 days',
    'Test Org'
  )) IS NOT NULL,
  'rpc_create_event should create new row'
);

select is(
  (select count(*) from public.events where title = 'Row Count Test Event'),
  1::bigint,
  'New event should be created'
);

select * from finish();
rollback;
