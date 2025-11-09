-- Seed data for basic testing
-- Using TEXT IDs compatible with Clerk user IDs

-- Insert test users (including your real Clerk user)
insert into public.users (id, email, full_name, created_at) values
  ('user_34vzEy76jAWsF3V3TxIo2miUmJk', 'jlinsdell@mba2026.hbs.edu', 'Jamie Linsdell', now()),
  ('user_test_seller_123456789abc', 'seller@test.com', 'Test Seller', now()),
  ('user_test_buyer_987654321xyz', 'buyer@test.com', 'Test Buyer', now())
ON CONFLICT (id) DO NOTHING;

-- Insert multiple upcoming events (visible to everyone)
insert into public.events (id, title, starts_at, ends_at, org, created_by, created_at) values
  (
    '33333333-3333-3333-3333-333333333333',
    'Fall Networking Mixer',
    now() + interval '7 days',
    now() + interval '7 days' + interval '3 hours',
    'Tech Club',
    'user_test_seller_123456789abc',
    now()
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Wine & Cheese Social',
    now() + interval '3 days',
    now() + interval '3 days' + interval '2 hours',
    'Finance Club',
    'user_test_seller_123456789abc',
    now()
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Guest Speaker: Tech in Finance',
    now() + interval '10 days',
    now() + interval '10 days' + interval '1 hour',
    'Fintech Society',
    'user_34vzEy76jAWsF3V3TxIo2miUmJk',
    now()
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Career Trek: Silicon Valley',
    now() + interval '14 days',
    now() + interval '17 days',
    'Career Development',
    'user_test_buyer_987654321xyz',
    now()
  ),
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'Annual Gala Dinner',
    now() + interval '21 days',
    now() + interval '21 days' + interval '4 hours',
    'Student Association',
    'user_test_buyer_987654321xyz',
    now()
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'Startup Pitch Competition',
    now() + interval '5 days',
    now() + interval '5 days' + interval '2 hours',
    'Entrepreneurship Club',
    'user_test_seller_123456789abc',
    now()
  );

-- Insert asks for various events
insert into public.asks (id, event_id, seller_id, price_cents, qty, qr_storage_path, status, created_at) values
  (
    '44444444-4444-4444-4444-444444444444',
    '33333333-3333-3333-3333-333333333333',
    'user_test_seller_123456789abc',
    5000,
    2,
    'test/seller-qr.png',
    'open',
    now()
  ),
  (
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'user_test_seller_123456789abc',
    3500,
    1,
    'test/wine-cheese-qr.png',
    'open',
    now()
  ),
  (
    '11111111-2222-3333-4444-555555555555',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'user_test_seller_123456789abc',
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
    'user_test_buyer_987654321xyz',
    4500,
    1,
    'open',
    now()
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'user_test_buyer_987654321xyz',
    3000,
    1,
    'open',
    now()
  ),
  (
    '77777777-7777-7777-7777-777777777777',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'user_test_buyer_987654321xyz',
    15000,
    2,
    'open',
    now()
  );
