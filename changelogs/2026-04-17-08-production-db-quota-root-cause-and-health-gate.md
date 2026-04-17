# 2026-04-17-08 Production DB Quota Root Cause and Health Gate

## Як було

- На production API спостерігалися симптоми недоступності даних:
- `/api/health` повертав `200`, але `/api/health/db` повертав `503 DB_UNAVAILABLE`.
- `/api/public` повертав `500 INTERNAL_SERVER_ERROR`.
- `/api/auth/login` для невалідного пароля повертав `503 AUTH_SERVICE_UNAVAILABLE` (через деградацію DB-залежного auth-шляху).
- Була невизначеність, чи це мережа/SSL/route mismatch Cloud Run, чи проблема з лімітом провайдера БД.

## Що зроблено

- Виконано production read-only probes проти Cloud Run сервісу `core64-api`:
- Визначено актуальний API base: `https://core64-api-rjyrggtsaq-ew.a.run.app/api`.
- Підтверджено фактичні статуси endpoint-ів:
- `GET /api/health` -> `200`.
- `GET /api/health/db` -> стабільно `503`.
- `GET /api/public` -> `500`.
- `POST /api/auth/login` з порожнім паролем -> `400 AUTH_PASSWORD_REQUIRED`.
- `POST /api/auth/login` з некоректним паролем -> `503 AUTH_SERVICE_UNAVAILABLE`.
- Знято повний payload `/api/health/db`: `details.dbCode = XX000`, target на Neon host, `sslmode=require`.
- Запущено strict runtime diagnostics без розкриття секретів:
- `check-database-url-policy --strict` -> `valid: true`.
- `print-db-target-snapshot --strict` -> коректний target (`neondb`, Neon host, `sslmode=require`).
- `print-db-runtime-tls-hint --strict` -> `effectiveSslmodeBehavior: libpq-require`.
- `print-cloud-run-db-route-verdict --strict` -> `routeVerdict: compatible`.
- Виконано локальний `SELECT 1` з тим самим `DATABASE_URL` і прод TLS-прапорами:
- Отримано `code: XX000` з повідомленням про перевищення data transfer quota.
- Виконано non-mutating smoke у `health`-режимі:
- `passed: false`, `health: 200`, `health/db: 503`, `csp-report endpoint: 204`.

## Що покращило/виправило/додало

- Інцидент локалізовано до першопричини рівня DB-провайдера: перевищено quota трафіку (а не CORS, не API base drift, не некоректний TLS-профіль, не очевидний Cloud Run route mismatch).
- Отримано верифікований прод-статус для критичних endpoint-ів (`/health`, `/health/db`, `/public`, `/auth/login`) для оперативного triage та релізного decision-making.
- Сформовано чіткий remediation-напрям без ризикових змін у коді:
- відновити DB quota/план у провайдера;
- після відновлення повторити health-only smoke, потім full smoke на production.
