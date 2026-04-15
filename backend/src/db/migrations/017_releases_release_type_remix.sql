UPDATE releases
SET release_type = CASE
    WHEN LOWER(TRIM(release_type)) IN ('ремікс', 'ремикс') THEN 'remix'
    WHEN LOWER(TRIM(release_type)) IN ('альбом') THEN 'album'
    WHEN LOWER(TRIM(release_type)) IN ('сингл') THEN 'single'
    ELSE LOWER(TRIM(release_type))
END
WHERE release_type IS NOT NULL;

UPDATE releases
SET release_type = 'single'
WHERE release_type IS NULL OR TRIM(release_type) = '';

ALTER TABLE releases
    DROP CONSTRAINT IF EXISTS releases_release_type_check;

ALTER TABLE releases
    ADD CONSTRAINT releases_release_type_check CHECK (release_type IN ('single', 'ep', 'album', 'remix'));
