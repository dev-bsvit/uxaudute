-- Migration: Add annotations field to audits table
-- Date: 2025-01-04
-- Description: Add annotations JSONB field to store canvas annotations data

-- Add annotations column to audits table
ALTER TABLE public.audits 
ADD COLUMN annotations jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.audits.annotations IS 'Canvas annotations data stored as JSONB';

-- Create index for better performance on annotations queries
CREATE INDEX idx_audits_annotations ON public.audits USING gin (annotations);

-- Update existing records to have null annotations
UPDATE public.audits SET annotations = NULL WHERE annotations IS NULL;

