-- Create storage bucket for QR codes
-- Bucket name: qr_codes
-- Access: Private (public = false)
-- Purpose: Store redacted QR codes for asks and tickets

-- Insert bucket configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'qr_codes',
  'qr_codes',
  false,  -- Private bucket, no public access
  10485760,  -- 10 MB in bytes
  ARRAY['image/png', 'image/jpeg']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
