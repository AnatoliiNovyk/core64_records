ALTER TABLE IF EXISTS section_settings_i18n
    ADD COLUMN IF NOT EXISTS nav_title TEXT NOT NULL DEFAULT '';

UPDATE section_settings_i18n
SET nav_title = title
WHERE COALESCE(TRIM(nav_title), '') = '';

INSERT INTO section_settings (section_key, sort_order, is_enabled, default_title)
VALUES ('contact', 5, TRUE, 'ЗВ''ЯЗАТИСЯ З НАМИ')
ON CONFLICT (section_key) DO NOTHING;

INSERT INTO section_settings_i18n (section_settings_id, language_code, title, nav_title)
SELECT ss.id, 'uk', 'ЗВ''ЯЗАТИСЯ З НАМИ', 'КОНТАКТИ'
FROM section_settings ss
WHERE ss.section_key = 'contact'
ON CONFLICT (section_settings_id, language_code)
DO UPDATE SET
    title = EXCLUDED.title,
    nav_title = EXCLUDED.nav_title,
    updated_at = NOW();

INSERT INTO section_settings_i18n (section_settings_id, language_code, title, nav_title)
SELECT ss.id, 'en', 'CONTACT US', 'CONTACT'
FROM section_settings ss
WHERE ss.section_key = 'contact'
ON CONFLICT (section_settings_id, language_code)
DO UPDATE SET
    title = EXCLUDED.title,
    nav_title = EXCLUDED.nav_title,
    updated_at = NOW();

ALTER TABLE IF EXISTS settings_i18n
    ADD COLUMN IF NOT EXISTS hero_subtitle TEXT NOT NULL DEFAULT 'Neurofunk • Drum & Bass • Breakbeat • Techstep';

UPDATE settings_i18n
SET hero_subtitle = 'Neurofunk • Drum & Bass • Breakbeat • Techstep'
WHERE COALESCE(TRIM(hero_subtitle), '') = '';

INSERT INTO settings_i18n (
    settings_id,
    language_code,
    title,
    about,
    mission,
    contact_captcha_error_message,
    contact_captcha_missing_token_message,
    contact_captcha_invalid_domain_message,
    hero_subtitle
)
SELECT
    s.id,
    'en',
    s.title,
    s.about,
    s.mission,
    s.contact_captcha_error_message,
    s.contact_captcha_missing_token_message,
    s.contact_captcha_invalid_domain_message,
    'Neurofunk • Drum & Bass • Breakbeat • Techstep'
FROM settings s
ON CONFLICT (settings_id, language_code)
DO UPDATE SET
    hero_subtitle = EXCLUDED.hero_subtitle,
    updated_at = NOW();
