ALTER TABLE releases
    ADD COLUMN IF NOT EXISTS release_type TEXT NOT NULL DEFAULT 'single';

UPDATE releases
SET release_type = 'single'
WHERE release_type IS NULL OR TRIM(release_type) = '';

ALTER TABLE releases
    DROP CONSTRAINT IF EXISTS releases_release_type_check;

ALTER TABLE releases
    ADD CONSTRAINT releases_release_type_check CHECK (release_type IN ('single', 'ep', 'album'));
