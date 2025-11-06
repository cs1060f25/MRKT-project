-- Seed data for basic testing
-- Fixed UUIDs for reproducible tests

-- Insert 2 users (seller and buyer)
insert into public.users (id, email, full_name, created_at) values
  ('11111111-1111-1111-1111-111111111111', 'seller@test.com', 'Test Seller', now()),
  ('22222222-2222-2222-2222-222222222222', 'buyer@test.com', 'Test Buyer', now());

-- Insert multiple upcoming events (visible to everyone)
insert into public.events (id, title, starts_at, ends_at, org, created_by, created_at) values
  (
    '33333333-3333-3333-3333-333333333333',
    'Fall Networking Mixer',
    now() + interval '7 days',
    now() + interval '7 days' + interval '3 hours',
    'Tech Club',
    '11111111-1111-1111-1111-111111111111',
    now()
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Wine & Cheese Social',
    now() + interval '3 days',
    now() + interval '3 days' + interval '2 hours',
    'Finance Club',
    '11111111-1111-1111-1111-111111111111',
    now()
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Guest Speaker: Tech in Finance',
    now() + interval '10 days',
    now() + interval '10 days' + interval '1 hour',
    'Fintech Society',
    '11111111-1111-1111-1111-111111111111',
    now()
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Career Trek: Silicon Valley',
    now() + interval '14 days',
    now() + interval '17 days',
    'Career Development',
    '22222222-2222-2222-2222-222222222222',
    now()
  ),
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'Annual Gala Dinner',
    now() + interval '21 days',
    now() + interval '21 days' + interval '4 hours',
    'Student Association',
    '22222222-2222-2222-2222-222222222222',
    now()
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'Startup Pitch Competition',
    now() + interval '5 days',
    now() + interval '5 days' + interval '2 hours',
    'Entrepreneurship Club',
    '11111111-1111-1111-1111-111111111111',
    now()
  );

-- Insert asks for various events
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
  ),
  (
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    3500,
    1,
    'test/wine-cheese-qr.png',
    'open',
    now()
  ),
  (
    '11111111-2222-3333-4444-555555555555',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    '11111111-1111-1111-1111-111111111111',
    7500,
    3,
    'test/pitch-comp-qr.png',
    'open',
    now()
  );

-- Insert bids for various events
insert into public.bids (id, event_id, buyer_id, price_cents, qty, status, created_at) values
  (
    '55555555-5555-5555-5555-555555555555',
    '33333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222222',
    4500,
    1,
    'open',
    now()
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '22222222-2222-2222-2222-222222222222',
    3000,
    1,
    'open',
    now()
  ),
  (
    '77777777-7777-7777-7777-777777777777',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '22222222-2222-2222-2222-222222222222',
    15000,
    2,
    'open',
    now()
  );
