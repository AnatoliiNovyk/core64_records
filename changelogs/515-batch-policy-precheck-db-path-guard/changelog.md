# 515 Batch - policy precheck db-path guard

## Як було

- `scripts/check-database-url-policy.mjs` у strict mode міг повертати `valid: true` для структурно невалідного `DATABASE_URL` без host/db path.
- Через це deploy падав пізніше на runtime config validation у `backend/src/config.js` з помилкою про відсутній database name path.

## Що зроблено

- Оновлено `scripts/check-database-url-policy.mjs`:
  - додано структурні перевірки після URL parse:
    - `missing_database_host` для порожнього host;
    - `missing_database_name` для порожнього db path (`/dbname`).
  - уніфіковано побудову `snapshot` через локальний helper, щоб уникнути дрейфу payload.
- Оновлено `scripts/test-check-database-url-policy.mjs`:
  - додано regression-кейси strict mode для missing host і missing database name.

## Що покращило

- Невалідний `DATABASE_URL` тепер відхиляється раніше на policy-precheck етапі CI, а не лише на runtime validation.
- Повідомлення про помилку стало детермінованим (`reason`-коди), що скорочує час triage під час деплою.
