-- Make personal_best nullable to support athletes without enrichment data
-- This allows the sync script to work with --skip-enrichment flag

ALTER TABLE athletes 
  ALTER COLUMN personal_best DROP NOT NULL;

COMMENT ON COLUMN athletes.personal_best IS 
  'Personal best marathon time (format: H:MM:SS). May be NULL if not yet fetched from profile.';
