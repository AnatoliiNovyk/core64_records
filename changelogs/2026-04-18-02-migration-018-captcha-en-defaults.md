# Migration 018: Fix captcha EN defaults in settings_i18n

## Previous state

After the production DB cutover (migration 017 → `core64-api` redirected to healthy Neon endpoint),
the `settings_i18n` table contained Ukrainian-language text in the `en` language row for three captcha fields:

- `contact_captcha_error_message` = `"Не вдалося пройти перевірку captcha."`
- `contact_captcha_missing_token_message` = `"Підтвердіть, що ви не робот."`
- `contact_captcha_invalid_domain_message` = `"Відправка з цього домену заборонена."`

These Ukrainian defaults were written to the `en` row because `validate.js` defaults (applied on upsert)
are defined only in Ukrainian, and no explicit English overrides were ever seeded.

As a result, `GET /api/public?lang=en` returned Ukrainian captcha messages to English-locale users.

## What was changed

Created and applied `backend/src/db/migrations/018_settings_i18n_captcha_en_defaults.sql`:

```sql
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
```

Migration is idempotent — only applies if all three EN captcha fields still contain the Ukrainian defaults.
Run against production DB (`ep-polished-haze-aju8lru4-pooler`) via `DATABASE_URL` env override.

## Resulting improvement

`GET /api/public?lang=en` now returns correct English captcha error messages:

- `contactCaptchaErrorMessage`: "Failed to verify captcha." ✓
- `contactCaptchaMissingTokenMessage`: "Please confirm you are not a robot." ✓
- `contactCaptchaInvalidDomainMessage`: "Submissions from this domain are not allowed." ✓

EN locale data quality restored. Pre-release gate settings/public contract check expected to pass.
