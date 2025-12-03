-- Fix rpc_create_event to restore input validation
-- The previous migration overwrote the function without validation

CREATE OR REPLACE FUNCTION public.rpc_create_event(
  title text,
  starts_at timestamptz,
  ends_at timestamptz,
  org text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  new_id uuid;
BEGIN
  -- Input validation
  IF title IS NULL THEN
    RAISE EXCEPTION 'title cannot be null';
  END IF;

  IF trim(title) = '' THEN
    RAISE EXCEPTION 'title cannot be null or empty';
  END IF;

  IF starts_at IS NULL THEN
    RAISE EXCEPTION 'starts_at cannot be null';
  END IF;

  IF ends_at IS NULL THEN
    RAISE EXCEPTION 'ends_at cannot be null';
  END IF;

  IF org IS NULL OR trim(org) = '' THEN
    RAISE EXCEPTION 'org cannot be null or empty';
  END IF;

  IF starts_at >= ends_at THEN
    RAISE EXCEPTION 'starts_at must be before ends_at';
  END IF;

  -- Insert event
  INSERT INTO public.events (id, title, starts_at, ends_at, org, created_by)
  VALUES (gen_random_uuid(), title, starts_at, ends_at, org, (auth.jwt()->>'sub'))
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;
