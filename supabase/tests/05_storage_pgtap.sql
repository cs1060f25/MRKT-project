begin;
select plan(19);

-- ============================================================================
-- TEST: Storage bucket exists and is properly configured
-- ============================================================================

select ok(
  EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'qr_codes'),
  'qr_codes bucket should exist'
);

select is(
  (SELECT public FROM storage.buckets WHERE id = 'qr_codes'),
  false,
  'qr_codes bucket should be private (public = false)'
);

select is(
  (SELECT file_size_limit FROM storage.buckets WHERE id = 'qr_codes'),
  10485760::bigint,
  'qr_codes bucket should have 10MB file size limit'
);

select ok(
  (SELECT 'image/png' = ANY(allowed_mime_types) FROM storage.buckets WHERE id = 'qr_codes'),
  'qr_codes bucket should allow image/png'
);

select ok(
  (SELECT 'image/jpeg' = ANY(allowed_mime_types) FROM storage.buckets WHERE id = 'qr_codes'),
  'qr_codes bucket should allow image/jpeg'
);

-- ============================================================================
-- TEST: Helper functions work correctly
-- ============================================================================

-- Valid paths
select ok(
  public.validate_qr_storage_path('33333333-3333-3333-3333-333333333333/44444444-4444-4444-4444-444444444444/qr.png'),
  'validate_qr_storage_path should accept valid UUID/UUID/qr.png format'
);

select ok(
  public.validate_qr_storage_path('33333333-3333-3333-3333-333333333333/44444444-4444-4444-4444-444444444444/qr.jpeg'),
  'validate_qr_storage_path should accept valid UUID/UUID/qr.jpeg format'
);

-- Invalid paths
select ok(
  NOT public.validate_qr_storage_path('invalid/path/file.png'),
  'validate_qr_storage_path should reject non-UUID paths'
);

select ok(
  NOT public.validate_qr_storage_path('33333333-3333-3333-3333-333333333333/44444444-4444-4444-4444-444444444444/wrong.png'),
  'validate_qr_storage_path should reject files not named qr.{png|jpeg}'
);

-- Test generate_qr_storage_path function
select is(
  public.generate_qr_storage_path(
    '33333333-3333-3333-3333-333333333333'::uuid,
    '44444444-4444-4444-4444-444444444444'::uuid,
    'png'
  ),
  '33333333-3333-3333-3333-333333333333/44444444-4444-4444-4444-444444444444/qr.png',
  'generate_qr_storage_path should create properly formatted path'
);

-- ============================================================================
-- SETUP: Create test data for storage policy tests
-- ============================================================================

-- Use existing seeded users:
-- Seller: 11111111-1111-1111-1111-111111111111
-- Buyer:  22222222-2222-2222-2222-222222222222
-- Event:  33333333-3333-3333-3333-333333333333
-- Ask:    44444444-4444-4444-4444-444444444444
-- Bid:    55555555-5555-5555-5555-555555555555

-- Create a match and ticket for testing
set local role postgres;

-- Create a match between seller's ask and buyer's bid
INSERT INTO public.matches (id, event_id, ask_id, bid_id, clearing_price_cents, qty)
VALUES (
  'aaaa1111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555',
  5000,
  1
);

-- Create a ticket for the winner (buyer)
INSERT INTO public.tickets (id, match_id, winner_id, qr_storage_path)
VALUES (
  'bbbb2222-2222-2222-2222-222222222222',
  'aaaa1111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  public.generate_qr_storage_path(
    '33333333-3333-3333-3333-333333333333'::uuid,
    'bbbb2222-2222-2222-2222-222222222222'::uuid
  )
);

reset role;

-- ============================================================================
-- TEST: Seller can upload QR code for their own ask (INSERT policy)
-- ============================================================================

set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111"}';

-- Attempt to insert storage object for seller's ask
prepare seller_upload_own_ask as
  INSERT INTO storage.objects (bucket_id, name, owner, metadata)
  VALUES (
    'qr_codes',
    public.generate_qr_storage_path(
      '33333333-3333-3333-3333-333333333333'::uuid,
      '44444444-4444-4444-4444-444444444444'::uuid
    ),
    '11111111-1111-1111-1111-111111111111'::uuid,
    '{"mimetype": "image/png", "size": 1024}'::jsonb
  );

select lives_ok('seller_upload_own_ask', 'Seller should be able to upload QR for their own ask');

-- ============================================================================
-- TEST: Non-seller cannot upload QR code for another user's ask (INSERT policy)
-- ============================================================================

-- Switch to buyer (not the seller of the ask)
set local request.jwt.claims to '{"sub": "22222222-2222-2222-2222-222222222222"}';

prepare buyer_upload_seller_ask as
  INSERT INTO storage.objects (bucket_id, name, owner, metadata)
  VALUES (
    'qr_codes',
    '33333333-3333-3333-3333-333333333333/44444444-4444-4444-4444-444444444444/qr.png',
    '22222222-2222-2222-2222-222222222222'::uuid,
    '{"mimetype": "image/png", "size": 1024}'::jsonb
  );

select throws_ok('buyer_upload_seller_ask', '42501', null, 'Non-seller should NOT be able to upload QR for another user ask');

-- ============================================================================
-- TEST: Seller can read (SELECT) QR code for their ask
-- ============================================================================

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111"}';

select isnt_empty(
  format(
    'SELECT * FROM storage.objects WHERE bucket_id = ''qr_codes'' AND name = ''%s''',
    public.generate_qr_storage_path(
      '33333333-3333-3333-3333-333333333333'::uuid,
      '44444444-4444-4444-4444-444444444444'::uuid
    )
  ),
  'Seller should be able to read QR code for their own ask'
);

-- ============================================================================
-- TEST: Winner can read (SELECT) QR code for their ticket
-- ============================================================================

-- First, insert a ticket QR (as postgres to bypass policies)
set local role postgres;
INSERT INTO storage.objects (bucket_id, name, owner, metadata)
VALUES (
  'qr_codes',
  public.generate_qr_storage_path(
    '33333333-3333-3333-3333-333333333333'::uuid,
    'bbbb2222-2222-2222-2222-222222222222'::uuid
  ),
  null,  -- No owner (system-generated)
  '{"mimetype": "image/png", "size": 2048}'::jsonb
);
reset role;

-- Switch to winner (buyer who won the ticket)
set local role authenticated;
set local request.jwt.claims to '{"sub": "22222222-2222-2222-2222-222222222222"}';

select isnt_empty(
  format(
    'SELECT * FROM storage.objects WHERE bucket_id = ''qr_codes'' AND name = ''%s''',
    public.generate_qr_storage_path(
      '33333333-3333-3333-3333-333333333333'::uuid,
      'bbbb2222-2222-2222-2222-222222222222'::uuid
    )
  ),
  'Winner should be able to read QR code for their ticket'
);

-- ============================================================================
-- TEST: Unauthorized user cannot read QR codes
-- ============================================================================

-- Switch to a different user who is not the seller or winner
set local request.jwt.claims to '{"sub": "99999999-9999-9999-9999-999999999999"}';

select is_empty(
  format(
    'SELECT * FROM storage.objects WHERE bucket_id = ''qr_codes'' AND name = ''%s''',
    public.generate_qr_storage_path(
      '33333333-3333-3333-3333-333333333333'::uuid,
      '44444444-4444-4444-4444-444444444444'::uuid
    )
  ),
  'Unauthorized user should NOT be able to read QR codes'
);

-- ============================================================================
-- TEST: Updates are denied (immutable files)
-- ============================================================================

set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111"}';

-- Try to update the seller's own ask QR (should silently fail - no UPDATE policy)
UPDATE storage.objects
SET metadata = '{"mimetype": "image/jpeg", "size": 4096}'::jsonb
WHERE bucket_id = 'qr_codes'
  AND name = public.generate_qr_storage_path(
    '33333333-3333-3333-3333-333333333333'::uuid,
    '44444444-4444-4444-4444-444444444444'::uuid
  );

-- Verify the metadata was NOT updated (should still be original value)
select is(
  (
    SELECT metadata->>'mimetype'
    FROM storage.objects
    WHERE bucket_id = 'qr_codes'
      AND name = public.generate_qr_storage_path(
        '33333333-3333-3333-3333-333333333333'::uuid,
        '44444444-4444-4444-4444-444444444444'::uuid
      )
  ),
  'image/png',
  'Updates should be denied (QR codes are immutable - metadata unchanged)'
);

-- ============================================================================
-- TEST: Seller can delete QR for open ask
-- ============================================================================

-- The ask 44444444... is still open in seed data, so deletion should work
prepare delete_open_ask_qr as
  DELETE FROM storage.objects
  WHERE bucket_id = 'qr_codes'
    AND name = public.generate_qr_storage_path(
      '33333333-3333-3333-3333-333333333333'::uuid,
      '44444444-4444-4444-4444-444444444444'::uuid
    );

select lives_ok('delete_open_ask_qr', 'Seller should be able to delete QR for their open ask');

-- ============================================================================
-- TEST: Seller cannot delete QR for matched ask
-- ============================================================================

-- Create a matched ask with QR
set local role postgres;

INSERT INTO public.asks (id, event_id, seller_id, price_cents, qty, qr_storage_path, status)
VALUES (
  'cccc3333-3333-3333-3333-333333333333',
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  6000,
  1,
  public.generate_qr_storage_path(
    '33333333-3333-3333-3333-333333333333'::uuid,
    'cccc3333-3333-3333-3333-333333333333'::uuid
  ),
  'matched'  -- Status is matched, not open
);

-- Insert the QR object
INSERT INTO storage.objects (bucket_id, name, owner, metadata)
VALUES (
  'qr_codes',
  public.generate_qr_storage_path(
    '33333333-3333-3333-3333-333333333333'::uuid,
    'cccc3333-3333-3333-3333-333333333333'::uuid
  ),
  '11111111-1111-1111-1111-111111111111'::uuid,
  '{"mimetype": "image/png", "size": 1024}'::jsonb
);

reset role;

-- Try to delete as seller (should fail because status != 'open')
set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111"}';

DELETE FROM storage.objects
WHERE bucket_id = 'qr_codes'
  AND name = public.generate_qr_storage_path(
    '33333333-3333-3333-3333-333333333333'::uuid,
    'cccc3333-3333-3333-3333-333333333333'::uuid
  );

select ok(
  EXISTS(
    SELECT 1 FROM storage.objects
    WHERE bucket_id = 'qr_codes'
      AND name = public.generate_qr_storage_path(
        '33333333-3333-3333-3333-333333333333'::uuid,
        'cccc3333-3333-3333-3333-333333333333'::uuid
      )
  ),
  'Seller should NOT be able to delete QR for matched ask (object still exists)'
);

-- ============================================================================
-- TEST: Anonymous users cannot access storage
-- ============================================================================

set local role anon;

select is_empty(
  'SELECT * FROM storage.objects WHERE bucket_id = ''qr_codes''',
  'Anonymous users should NOT be able to view storage objects'
);

select * from finish();
rollback;
