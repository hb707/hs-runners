-- Add exercise duration fields to records table
-- durationSeconds: extracted by Vision AI
-- manualDurationSeconds: overridden by user
ALTER TABLE public.records
  ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS manual_duration_seconds INTEGER;
