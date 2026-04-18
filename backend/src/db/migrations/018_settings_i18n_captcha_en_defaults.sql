-- Migration 018: Fix captcha EN defaults in settings_i18n
-- Idempotent: only updates rows where EN captcha fields still contain Ukrainian defaults.

UPDATE settings_i18n
SET
  contact_captcha_error_message        = 'Failed to verify captcha.',
  contact_captcha_missing_token_message = 'Please confirm you are not a robot.',
  contact_captcha_invalid_domain_message = 'Submissions from this domain are not allowed.',
  updated_at = NOW()
WHERE language_code = 'en'
  AND contact_captcha_error_message         = 'Не вдалося пройти перевірку captcha.'
  AND contact_captcha_missing_token_message = 'Підтвердіть, що ви не робот.'
  AND contact_captcha_invalid_domain_message = 'Відправка з цього домену заборонена.';
