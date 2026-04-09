# 2026-04-09-15 Settings Contract Negative Validation And Gate Integration

## Як було
- [scripts/settings-public-contract-check.mjs](scripts/settings-public-contract-check.mjs) перевіряв лише позитивний сценарій для `title/about/mission` і не покривав негативні кейси валідації `PUT /settings`.
- У скрипті контракту не було перевірки auth-guard для `GET /settings` без токена.
- Local/CI pre-release gate не мав обов'язкового кроку запуску settings/public contract check, тому регресії валідації могли виявлятись пізніше.

## Що зроблено
- Розширено [scripts/settings-public-contract-check.mjs](scripts/settings-public-contract-check.mjs):
  - додано `authGuard`-перевірку (`GET /settings` без токена має повертати `401`);
  - розширено позитивний контракт на поля:
    - `title`, `about`, `mission`;
    - `heroSubtitleUk`/`heroSubtitleEn` (мапінг у `public.settings.heroSubtitle` по мовах);
    - `contactCaptchaErrorMessage`, `contactCaptchaMissingTokenMessage`, `contactCaptchaInvalidDomainMessage`;
  - додано негативні validation-кейси для `PUT /settings` (очікуваний `400 Validation failed` + field-level errors):
    - `empty_title`;
    - `captcha_enabled_without_provider`;
    - `hcaptcha_missing_keys`;
    - `warn_latency_not_greater_than_good`;
    - `invalid_allowed_domain`;
  - додано post-negative перевірку, що валідний стан налаштувань не пошкоджується негативними запитами;
  - збережено restore-логіку оригінальних налаштувань у `finally`.
- Оновлено [scripts/pre-release-gate-local.ps1](scripts/pre-release-gate-local.ps1):
  - додано крок `[8/10] Running settings/public contract check...`;
  - перенумеровано кроки до `10`.
- Оновлено [pre-release workflow](.github/workflows/pre-release-gate.yml):
  - додано крок `Run settings/public contract check` після `Run smoke-check`.

## Що покращило/виправило/додало
- Контрактний тест тепер ловить не лише дрейф публічного payload, а й регресії серверної валідації `settingsSchema`.
- Виявлення помилок по captcha/threshold/domain правилах стало раннім і детермінованим.
- Local та CI pre-release gate отримали додатковий захист від невидимих змін контракту між admin settings і public settings.
