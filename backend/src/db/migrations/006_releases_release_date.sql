ALTER TABLE releases
    ADD COLUMN IF NOT EXISTS release_date DATE;

UPDATE releases
SET release_date = CASE
    WHEN year ~ '^\d{4}$' THEN make_date(year::int, 1, 1)
    ELSE COALESCE(created_at::date, CURRENT_DATE)
END
WHERE release_date IS NULL;

ALTER TABLE releases
    ALTER COLUMN release_date SET DEFAULT CURRENT_DATE;

ALTER TABLE releases
    ALTER COLUMN release_date SET NOT NULL;
