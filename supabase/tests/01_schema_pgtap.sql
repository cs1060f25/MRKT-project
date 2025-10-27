begin;
select plan(104);

-- ============================================================================
-- TABLE EXISTENCE TESTS
-- ============================================================================
select has_table('public', 'users', 'users table should exist');
select has_table('public', 'events', 'events table should exist');
select has_table('public', 'asks', 'asks table should exist');
select has_table('public', 'bids', 'bids table should exist');
select has_table('public', 'matches', 'matches table should exist');
select has_table('public', 'tickets', 'tickets table should exist');

-- ============================================================================
-- PRIMARY KEY TESTS
-- ============================================================================
select has_pk('public', 'users', 'users should have primary key');
select has_pk('public', 'events', 'events should have primary key');
select has_pk('public', 'asks', 'asks should have primary key');
select has_pk('public', 'bids', 'bids should have primary key');
select has_pk('public', 'matches', 'matches should have primary key');
select has_pk('public', 'tickets', 'tickets should have primary key');

-- ============================================================================
-- USERS TABLE COLUMN TESTS
-- ============================================================================
select has_column('public', 'users', 'id', 'users should have id column');
select has_column('public', 'users', 'email', 'users should have email column');
select has_column('public', 'users', 'full_name', 'users should have full_name column');
select has_column('public', 'users', 'created_at', 'users should have created_at column');

select col_not_null('public', 'users', 'id', 'users.id should be NOT NULL');
select col_not_null('public', 'users', 'email', 'users.email should be NOT NULL');
select col_not_null('public', 'users', 'created_at', 'users.created_at should be NOT NULL');

select col_has_default('public', 'users', 'created_at', 'users.created_at should have default');
select col_is_unique('public', 'users', 'email', 'users.email should be unique');

-- ============================================================================
-- EVENTS TABLE COLUMN TESTS
-- ============================================================================
select has_column('public', 'events', 'id', 'events should have id column');
select has_column('public', 'events', 'title', 'events should have title column');
select has_column('public', 'events', 'starts_at', 'events should have starts_at column');
select has_column('public', 'events', 'ends_at', 'events should have ends_at column');
select has_column('public', 'events', 'org', 'events should have org column');
select has_column('public', 'events', 'created_by', 'events should have created_by column');
select has_column('public', 'events', 'created_at', 'events should have created_at column');

select col_not_null('public', 'events', 'title', 'events.title should be NOT NULL');
select col_not_null('public', 'events', 'starts_at', 'events.starts_at should be NOT NULL');
select col_not_null('public', 'events', 'ends_at', 'events.ends_at should be NOT NULL');
select col_not_null('public', 'events', 'org', 'events.org should be NOT NULL');
select col_not_null('public', 'events', 'created_by', 'events.created_by should be NOT NULL');
select col_not_null('public', 'events', 'created_at', 'events.created_at should be NOT NULL');

select col_has_default('public', 'events', 'created_at', 'events.created_at should have default');

-- ============================================================================
-- ASKS TABLE COLUMN TESTS
-- ============================================================================
select has_column('public', 'asks', 'id', 'asks should have id column');
select has_column('public', 'asks', 'event_id', 'asks should have event_id column');
select has_column('public', 'asks', 'seller_id', 'asks should have seller_id column');
select has_column('public', 'asks', 'price_cents', 'asks should have price_cents column');
select has_column('public', 'asks', 'qty', 'asks should have qty column');
select has_column('public', 'asks', 'qr_storage_path', 'asks should have qr_storage_path column');
select has_column('public', 'asks', 'status', 'asks should have status column');
select has_column('public', 'asks', 'created_at', 'asks should have created_at column');

select col_not_null('public', 'asks', 'event_id', 'asks.event_id should be NOT NULL');
select col_not_null('public', 'asks', 'seller_id', 'asks.seller_id should be NOT NULL');
select col_not_null('public', 'asks', 'price_cents', 'asks.price_cents should be NOT NULL');
select col_not_null('public', 'asks', 'qty', 'asks.qty should be NOT NULL');
select col_not_null('public', 'asks', 'qr_storage_path', 'asks.qr_storage_path should be NOT NULL');
select col_not_null('public', 'asks', 'status', 'asks.status should be NOT NULL');
select col_not_null('public', 'asks', 'created_at', 'asks.created_at should be NOT NULL');

select col_has_default('public', 'asks', 'status', 'asks.status should have default');
select col_has_default('public', 'asks', 'created_at', 'asks.created_at should have default');

-- ============================================================================
-- BIDS TABLE COLUMN TESTS
-- ============================================================================
select has_column('public', 'bids', 'id', 'bids should have id column');
select has_column('public', 'bids', 'event_id', 'bids should have event_id column');
select has_column('public', 'bids', 'buyer_id', 'bids should have buyer_id column');
select has_column('public', 'bids', 'price_cents', 'bids should have price_cents column');
select has_column('public', 'bids', 'qty', 'bids should have qty column');
select has_column('public', 'bids', 'status', 'bids should have status column');
select has_column('public', 'bids', 'created_at', 'bids should have created_at column');

select col_not_null('public', 'bids', 'event_id', 'bids.event_id should be NOT NULL');
select col_not_null('public', 'bids', 'buyer_id', 'bids.buyer_id should be NOT NULL');
select col_not_null('public', 'bids', 'price_cents', 'bids.price_cents should be NOT NULL');
select col_not_null('public', 'bids', 'qty', 'bids.qty should be NOT NULL');
select col_not_null('public', 'bids', 'status', 'bids.status should be NOT NULL');
select col_not_null('public', 'bids', 'created_at', 'bids.created_at should be NOT NULL');

select col_has_default('public', 'bids', 'status', 'bids.status should have default');
select col_has_default('public', 'bids', 'created_at', 'bids.created_at should have default');

-- ============================================================================
-- MATCHES TABLE COLUMN TESTS
-- ============================================================================
select has_column('public', 'matches', 'id', 'matches should have id column');
select has_column('public', 'matches', 'event_id', 'matches should have event_id column');
select has_column('public', 'matches', 'ask_id', 'matches should have ask_id column');
select has_column('public', 'matches', 'bid_id', 'matches should have bid_id column');
select has_column('public', 'matches', 'clearing_price_cents', 'matches should have clearing_price_cents column');
select has_column('public', 'matches', 'qty', 'matches should have qty column');
select has_column('public', 'matches', 'created_at', 'matches should have created_at column');

select col_not_null('public', 'matches', 'clearing_price_cents', 'matches.clearing_price_cents should be NOT NULL');
select col_not_null('public', 'matches', 'qty', 'matches.qty should be NOT NULL');
select col_has_default('public', 'matches', 'created_at', 'matches.created_at should have default');

-- ============================================================================
-- TICKETS TABLE COLUMN TESTS
-- ============================================================================
select has_column('public', 'tickets', 'id', 'tickets should have id column');
select has_column('public', 'tickets', 'match_id', 'tickets should have match_id column');
select has_column('public', 'tickets', 'winner_id', 'tickets should have winner_id column');
select has_column('public', 'tickets', 'qr_storage_path', 'tickets should have qr_storage_path column');
select has_column('public', 'tickets', 'delivered_at', 'tickets should have delivered_at column');
select has_column('public', 'tickets', 'created_at', 'tickets should have created_at column');

select col_not_null('public', 'tickets', 'match_id', 'tickets.match_id should be NOT NULL');
select col_not_null('public', 'tickets', 'winner_id', 'tickets.winner_id should be NOT NULL');
select col_not_null('public', 'tickets', 'qr_storage_path', 'tickets.qr_storage_path should be NOT NULL');
select col_not_null('public', 'tickets', 'created_at', 'tickets.created_at should be NOT NULL');

select col_has_default('public', 'tickets', 'created_at', 'tickets.created_at should have default');

-- ============================================================================
-- FOREIGN KEY TESTS
-- ============================================================================
select has_fk('public', 'events', 'events should have FK to users');
select has_fk('public', 'asks', 'asks should have FK to events and users');
select has_fk('public', 'bids', 'bids should have FK to events and users');
select has_fk('public', 'matches', 'matches should have FK to events, asks, and bids');
select has_fk('public', 'tickets', 'tickets should have FK to matches and users');

-- ============================================================================
-- INDEX TESTS
-- ============================================================================
select has_index('public', 'bids', 'bids_event_id_idx', 'bids should have event_id index');
select has_index('public', 'asks', 'asks_event_id_idx', 'asks should have event_id index');
select has_index('public', 'matches', 'matches_event_id_idx', 'matches should have event_id index');

-- ============================================================================
-- CHECK CONSTRAINT TESTS - NEGATIVE PRICE
-- ============================================================================

-- Test asks.price_cents rejects zero
prepare insert_ask_zero_price as
  insert into public.asks (id, event_id, seller_id, price_cents, qty, qr_storage_path, status)
  values (
    gen_random_uuid(),
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    0,
    1,
    'test.png',
    'open'
  );
select throws_ok('insert_ask_zero_price', '23514', null, 'asks should reject zero price_cents');

-- Test asks.price_cents rejects negative
prepare insert_ask_negative_price as
  insert into public.asks (id, event_id, seller_id, price_cents, qty, qr_storage_path, status)
  values (
    gen_random_uuid(),
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    -100,
    1,
    'test.png',
    'open'
  );
select throws_ok('insert_ask_negative_price', '23514', null, 'asks should reject negative price_cents');

-- Test bids.price_cents rejects zero
prepare insert_bid_zero_price as
  insert into public.bids (id, event_id, buyer_id, price_cents, qty, status)
  values (
    gen_random_uuid(),
    '33333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222222',
    0,
    1,
    'open'
  );
select throws_ok('insert_bid_zero_price', '23514', null, 'bids should reject zero price_cents');

-- Test bids.price_cents rejects negative
prepare insert_bid_negative_price as
  insert into public.bids (id, event_id, buyer_id, price_cents, qty, status)
  values (
    gen_random_uuid(),
    '33333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222222',
    -100,
    1,
    'open'
  );
select throws_ok('insert_bid_negative_price', '23514', null, 'bids should reject negative price_cents');

-- ============================================================================
-- CHECK CONSTRAINT TESTS - NEGATIVE QTY
-- ============================================================================

-- Test asks.qty rejects zero
prepare insert_ask_zero_qty as
  insert into public.asks (id, event_id, seller_id, price_cents, qty, qr_storage_path, status)
  values (
    gen_random_uuid(),
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    1000,
    0,
    'test.png',
    'open'
  );
select throws_ok('insert_ask_zero_qty', '23514', null, 'asks should reject zero qty');

-- Test bids.qty rejects zero
prepare insert_bid_zero_qty as
  insert into public.bids (id, event_id, buyer_id, price_cents, qty, status)
  values (
    gen_random_uuid(),
    '33333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222222',
    1000,
    0,
    'open'
  );
select throws_ok('insert_bid_zero_qty', '23514', null, 'bids should reject zero qty');

-- ============================================================================
-- CHECK CONSTRAINT TESTS - INVALID STATUS VALUES
-- ============================================================================

-- Test asks.status accepts invalid values (BUG - no constraint!)
prepare insert_ask_invalid_status as
  insert into public.asks (id, event_id, seller_id, price_cents, qty, qr_storage_path, status)
  values (
    gen_random_uuid(),
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    1000,
    1,
    'test.png',
    'invalid_status'
  );
select throws_ok('insert_ask_invalid_status', '23514', null, 'asks should reject invalid status values');

-- Test bids.status accepts invalid values (BUG - no constraint!)
prepare insert_bid_invalid_status as
  insert into public.bids (id, event_id, buyer_id, price_cents, qty, status)
  values (
    gen_random_uuid(),
    '33333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222222',
    1000,
    1,
    'invalid_status'
  );
select throws_ok('insert_bid_invalid_status', '23514', null, 'bids should reject invalid status values');

select * from finish();
rollback;
