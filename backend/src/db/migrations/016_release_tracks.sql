CREATE TABLE IF NOT EXISTS release_tracks (
    id SERIAL PRIMARY KEY,
    release_id INTEGER NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    audio_data_url TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT release_tracks_duration_seconds_range CHECK (duration_seconds >= 0 AND duration_seconds <= 86400),
    CONSTRAINT release_tracks_sort_order_range CHECK (sort_order >= 0 AND sort_order <= 9999)
);

CREATE INDEX IF NOT EXISTS release_tracks_release_sort_idx
    ON release_tracks (release_id, sort_order, id);
