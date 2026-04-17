# 2026-04-17-09 DB Quota Contract Hardening and Smoke Self-Test Stability

## Як було

- При перевищенні quota/лімітів БД частина backend-шляхів повертала занадто загальні помилки (наприклад `500 INTERNAL_SERVER_ERROR` для публічного payload або `503 AUTH_SERVICE_UNAVAILABLE` без окремого сигналу про DB quota).
- `health/db` у деградації з quota-помилкою міг мати `details.kind=unknown`, що ускладнювало класифікацію інциденту.
- Frontend/admin та adapter не всюди трактували `DB_STORAGE_LIMIT_REACHED`/`507` як окремий підтип DB-недоступності.
- `scripts/test-smoke-check.mjs` був чутливий до успадкованого `CORE64_SMOKE_MODE` з оточення, що могло давати флейк у happy-path.

## Що зроблено

- У `backend/src/utils/dbError.js`:
- посилено розпізнавання storage/quota-помилок за характерними повідомленнями (включно з data transfer quota);
- уточнено `isDatabaseConnectivityError` до явного списку connectivity-класів, щоб storage-limit не класифікувався як мережевий збій.
- У `backend/src/routes/health.js`:
- додано окрему класифікацію `storage_limit` для деградації `health/db`;
- для цього кейсу повертається `code=DB_STORAGE_LIMIT_REACHED` (статус деградації збережено `503`) з деталями (`storageLimitExceeded`, `dbCode`).
- У `backend/src/routes/auth.js`:
- додано окремий контракт для quota/storage-limit деградації auth: `503 AUTH_DB_STORAGE_LIMIT_REACHED` з безпечними деталями (`dbCode`).
- У фронтенді (`admin.js`, `app.js`, `data-adapter.js`):
- розширено розпізнавання DB-degraded для `DB_STORAGE_LIMIT_REACHED` та `507`;
- додано нові UX-тексти для auth/storage-limit та save/storage-limit;
- публічний статус API коректно відносить storage-limit до категорії проблем БД.
- У `scripts/verify-api-error-contract.mjs`:
- DB observer тепер приймає обидва деградовані коди (`DB_UNAVAILABLE`, `DB_STORAGE_LIMIT_REACHED`) і обидва валідні error-тексти.
- У `scripts/test-smoke-check.mjs`:
- для child smoke-процесу зафіксовано `CORE64_SMOKE_MODE=full`, щоб прибрати флейки від успадкованого env.

## Що покращило/виправило/додало

- Замість нечітких 500/503 у quota-сценарії система віддає більш діагностичні коди, що прискорює triage та зменшує ризик хибної інтерпретації інциденту як мережевого.
- Frontend/admin показують більш релевантний стан у кейсах DB quota/storage-limit, а adapter стабільніше переходить у DB-degraded логіку.
- Контрактні перевірки краще покривають реальні деградовані стани без втрати сумісності зі старим кодом `DB_UNAVAILABLE`.
- Smoke self-test став детермінованим у CI/local середовищах незалежно від зовнішніх env-прапорів.
