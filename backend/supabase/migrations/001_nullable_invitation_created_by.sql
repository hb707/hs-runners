-- Allow invitation_codes.created_by to be NULL
-- so that the master admin (virtual user, no DB row) can generate codes.
ALTER TABLE public.invitation_codes
  ALTER COLUMN created_by DROP NOT NULL;
