-- Helper functions for QR codes storage bucket
-- Provides utility functions for path validation and URL generation
-- NOTE: Functions are in public schema since we don't have permission to create in storage schema

-- ============================================================================
-- FUNCTION: public.validate_qr_storage_path
-- Validates that a storage path follows the required format
-- Format: {event_id}/{ask_id or ticket_id}/qr.{png|jpeg}
-- Returns: boolean
-- ============================================================================
CREATE OR REPLACE FUNCTION public.validate_qr_storage_path(path text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  parts text[];
  event_id_part text;
  id_part text;
  filename_part text;
BEGIN
  -- Split path by '/'
  parts := string_to_array(path, '/');

  -- Must have exactly 3 parts: event_id/id/filename
  IF array_length(parts, 1) != 3 THEN
    RETURN false;
  END IF;

  event_id_part := parts[1];
  id_part := parts[2];
  filename_part := parts[3];

  -- Validate event_id is a valid UUID
  IF event_id_part !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN false;
  END IF;

  -- Validate id (ask_id or ticket_id) is a valid UUID
  IF id_part !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN false;
  END IF;

  -- Validate filename is qr.png or qr.jpeg
  IF filename_part NOT IN ('qr.png', 'qr.jpeg') THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

-- ============================================================================
-- FUNCTION: public.generate_qr_storage_path
-- Generates a properly formatted storage path for QR codes
-- Parameters:
--   - event_id: UUID of the event
--   - resource_id: UUID of the ask or ticket
--   - extension: File extension ('png' or 'jpeg'), defaults to 'png'
-- Returns: text (formatted path)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.generate_qr_storage_path(
  event_id uuid,
  resource_id uuid,
  extension text DEFAULT 'png'
)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Validate extension
  IF extension NOT IN ('png', 'jpeg') THEN
    RAISE EXCEPTION 'Invalid extension: %. Must be png or jpeg.', extension;
  END IF;

  -- Return formatted path
  RETURN format('%s/%s/qr.%s', event_id, resource_id, extension);
END;
$$;

-- ============================================================================
-- Comments for documentation
-- ============================================================================
COMMENT ON FUNCTION public.validate_qr_storage_path IS
  'Validates that a storage path follows the format: {event_id}/{resource_id}/qr.{png|jpeg}';

COMMENT ON FUNCTION public.generate_qr_storage_path IS
  'Generates a properly formatted storage path for QR codes given event_id and resource_id';
