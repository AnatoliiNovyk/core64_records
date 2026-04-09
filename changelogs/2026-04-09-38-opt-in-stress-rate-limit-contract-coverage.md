# 2026-04-09-38 Opt-in Stress Rate-Limit Contract Coverage

## Як було

- `scripts/verify-api-error-contract.mjs` уже перевіряв базовий `auth` rate-limit (`AUTH_RATE_LIMITED`), але не мав окремого stress-режиму для mutation limiter-ів `settings` і `collections`.
- Контракт `429` для `SETTINGS_RATE_LIMITED` та `COLLECTIONS_RATE_LIMITED` не перевірявся у runtime verifier навіть як opt-in.
- `scripts/test-verify-api-error-contract.mjs` не покривав deterministic stress кейси для `settings`/`collections` rate-limit і не мав негативних mismatch сценаріїв для них.

## Що зроблено

- Розширено `scripts/verify-api-error-contract.mjs`:
  - додано opt-in stress режим через `CORE64_CONTRACT_STRESS_RATE_LIMIT_CHECK` (default `false`);
  - додано env knobs:
    - `CORE64_CONTRACT_SETTINGS_RATE_LIMIT_ATTEMPTS` (default `22`),
    - `CORE64_CONTRACT_COLLECTIONS_RATE_LIMIT_ATTEMPTS` (default `32`);
  - додано нові runtime checks:
    - `settingsRateLimitedStress` (проби `PUT /settings` з очікуванням `429 SETTINGS_RATE_LIMITED` + `Retry-After >= 1`),
    - `collectionsRateLimitedStress` (проби `PUT /releases/999999` з очікуванням `429 COLLECTIONS_RATE_LIMITED` + `Retry-After >= 1`);
  - коли stress режим вимкнений, обидва checks повертаються як `skipped` з `ok=true`, без впливу на базовий gate-потік.
- Розширено `scripts/test-verify-api-error-contract.mjs`:
  - mock server тепер емулює ліміти для `settings` і `collections` mutation path;
  - додано позитивний кейс `stress-rate-limit-enabled`;
  - додано негативні кейси `settings-rate-limit-mismatch` і `collections-rate-limit-mismatch`.

## Що покращило/виправило/додало

- Закрито coverage-gap для контрактів `429` на settings/collections без зміни default стабільності pre-release перевірок.
- Додано керований stress-контур, який можна вмикати лише коли потрібно поглиблене rate-limit тестування.
- Підвищено надійність regression detection для mutation limiter-ів завдяки deterministic self-test сценаріям і runtime валідації з чіткими очікуваннями `code/error/retry-after`.
