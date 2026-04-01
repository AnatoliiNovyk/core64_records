CREATE TABLE IF NOT EXISTS releases_i18n (
    id SERIAL PRIMARY KEY,
    release_id INTEGER NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    genre TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (release_id, language_code)
);

CREATE TABLE IF NOT EXISTS artists_i18n (
    id SERIAL PRIMARY KEY,
    artist_id INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL,
    name TEXT NOT NULL,
    genre TEXT NOT NULL DEFAULT '',
    bio TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (artist_id, language_code)
);

CREATE TABLE IF NOT EXISTS events_i18n (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL,
    title TEXT NOT NULL,
    venue TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (event_id, language_code)
);

CREATE TABLE IF NOT EXISTS sponsors_i18n (
    id SERIAL PRIMARY KEY,
    sponsor_id INTEGER NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL,
    name TEXT NOT NULL,
    short_description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (sponsor_id, language_code)
);

CREATE TABLE IF NOT EXISTS settings_i18n (
    id SERIAL PRIMARY KEY,
    settings_id INTEGER NOT NULL REFERENCES settings(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL,
    title TEXT NOT NULL,
    about TEXT NOT NULL DEFAULT '',
    mission TEXT NOT NULL DEFAULT '',
    contact_captcha_error_message TEXT NOT NULL DEFAULT '',
    contact_captcha_missing_token_message TEXT NOT NULL DEFAULT '',
    contact_captcha_invalid_domain_message TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (settings_id, language_code)
);

INSERT INTO releases_i18n (release_id, language_code, title, artist, genre)
SELECT id, 'uk', title, artist, genre
FROM releases
ON CONFLICT (release_id, language_code) DO NOTHING;

INSERT INTO artists_i18n (artist_id, language_code, name, genre, bio)
SELECT id, 'uk', name, genre, bio
FROM artists
ON CONFLICT (artist_id, language_code) DO NOTHING;

INSERT INTO events_i18n (event_id, language_code, title, venue, description)
SELECT id, 'uk', title, venue, description
FROM events
ON CONFLICT (event_id, language_code) DO NOTHING;

INSERT INTO sponsors_i18n (sponsor_id, language_code, name, short_description)
SELECT id, 'uk', name, short_description
FROM sponsors
ON CONFLICT (sponsor_id, language_code) DO NOTHING;

INSERT INTO settings_i18n (
    settings_id,
    language_code,
    title,
    about,
    mission,
    contact_captcha_error_message,
    contact_captcha_missing_token_message,
    contact_captcha_invalid_domain_message
)
SELECT
    id,
    'uk',
    title,
    about,
    mission,
    contact_captcha_error_message,
    contact_captcha_missing_token_message,
    contact_captcha_invalid_domain_message
FROM settings
ON CONFLICT (settings_id, language_code) DO NOTHING;
