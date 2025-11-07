-- Add PDF support to qr_codes storage bucket
-- Extends allowed MIME types to include application/pdf

UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'application/pdf']::text[]
WHERE id = 'qr_codes';
