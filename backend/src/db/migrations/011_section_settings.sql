CREATE TABLE IF NOT EXISTS section_settings (
    id SERIAL PRIMARY KEY,
    section_key TEXT NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    default_title TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS section_settings_i18n (
    id SERIAL PRIMARY KEY,
    section_settings_id INTEGER NOT NULL REFERENCES section_settings(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (section_settings_id, language_code)
);

INSERT INTO section_settings (section_key, sort_order, is_enabled, default_title)
VALUES
    ('releases', 1, TRUE, 'ОСТАННІ РЕЛІЗИ'),
    ('artists', 2, TRUE, 'АРТИСТИ ЛЕЙБЛУ'),
    ('events', 3, TRUE, 'АФІША ПОДІЙ'),
    ('sponsors', 4, TRUE, 'СПОНСОРИ, ПАРТНЕРИ ТА ДРУЗІ')
ON CONFLICT (section_key) DO NOTHING;

INSERT INTO section_settings_i18n (section_settings_id, language_code, title)
SELECT ss.id, 'uk', titles.title_uk
FROM section_settings ss
JOIN (
    VALUES
        ('releases', 'ОСТАННІ РЕЛІЗИ', 'LATEST RELEASES'),
        ('artists', 'АРТИСТИ ЛЕЙБЛУ', 'LABEL ARTISTS'),
        ('events', 'АФІША ПОДІЙ', 'EVENT SCHEDULE'),
        ('sponsors', 'СПОНСОРИ, ПАРТНЕРИ ТА ДРУЗІ', 'SPONSORS, PARTNERS AND FRIENDS')
) AS titles(section_key, title_uk, title_en)
  ON titles.section_key = ss.section_key
ON CONFLICT (section_settings_id, language_code) DO NOTHING;

INSERT INTO section_settings_i18n (section_settings_id, language_code, title)
SELECT ss.id, 'en', titles.title_en
FROM section_settings ss
JOIN (
    VALUES
        ('releases', 'ОСТАННІ РЕЛІЗИ', 'LATEST RELEASES'),
        ('artists', 'АРТИСТИ ЛЕЙБЛУ', 'LABEL ARTISTS'),
        ('events', 'АФІША ПОДІЙ', 'EVENT SCHEDULE'),
        ('sponsors', 'СПОНСОРИ, ПАРТНЕРИ ТА ДРУЗІ', 'SPONSORS, PARTNERS AND FRIENDS')
) AS titles(section_key, title_uk, title_en)
  ON titles.section_key = ss.section_key
ON CONFLICT (section_settings_id, language_code) DO NOTHING;
