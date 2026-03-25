ALTER TABLE IF EXISTS settings
    ADD COLUMN IF NOT EXISTS contact_captcha_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS contact_captcha_active_provider TEXT NOT NULL DEFAULT 'none',
    ADD COLUMN IF NOT EXISTS contact_captcha_hcaptcha_site_key TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS contact_captcha_hcaptcha_secret_key TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS contact_captcha_recaptcha_site_key TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS contact_captcha_recaptcha_secret_key TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS contact_captcha_error_message TEXT NOT NULL DEFAULT 'Не вдалося пройти перевірку captcha.',
    ADD COLUMN IF NOT EXISTS contact_captcha_missing_token_message TEXT NOT NULL DEFAULT 'Підтвердіть, що ви не робот.',
    ADD COLUMN IF NOT EXISTS contact_captcha_invalid_domain_message TEXT NOT NULL DEFAULT 'Відправка з цього домену заборонена.',
    ADD COLUMN IF NOT EXISTS contact_captcha_allowed_domain TEXT NOT NULL DEFAULT '';
