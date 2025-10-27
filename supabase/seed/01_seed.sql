-- Seed data for basic testing
-- Fixed UUIDs for reproducible tests

-- Insert 2 users (seller and buyer)
insert into public.users (id, email, full_name, created_at) values
  ('11111111-1111-1111-1111-111111111111', 'seller@test.com', 'Test Seller', now()),
  ('22222222-2222-2222-2222-222222222222', 'buyer@test.com', 'Test Buyer', now());

-- Insert 1 event (created by seller)
insert into public.events (id, title, starts_at, ends_at, org, created_by, created_at) values
  (
    '33333333-3333-3333-3333-333333333333',
    'Fall Networking Mixer',
    now() + interval '7 days',
    now() + interval '7 days' + interval '3 hours',
    'Tech Club',
    '11111111-1111-1111-1111-111111111111',
    now()
  );

-- Insert 1 ask (seller offering 2 tickets at $50 each)
insert into public.asks (id, event_id, seller_id, price_cents, qty, qr_storage_path, status, created_at) values
  (
    '44444444-4444-4444-4444-444444444444',
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    5000,
    2,
    'test/seller-qr.png',
    'open',
    now()
  );

-- Insert 1 bid (buyer wants 1 ticket at $45)
insert into public.bids (id, event_id, buyer_id, price_cents, qty, status, created_at) values
  (
    '55555555-5555-5555-5555-555555555555',
    '33333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222222',
    4500,
    1,
    'open',
    now()
  );
