# 2026-04-09-36 API Error Contract Coverage (Non-Flaky)

## Як було

- `scripts/verify-api-error-contract.mjs` перевіряв лише 3 сценарії контракту помилок: `AUTH_REQUIRED`, `VALIDATION_FAILED` (settings email) і `API_ROUTE_NOT_FOUND`.
- Gate уже виконував verifier і його self-test, але покриття не охоплювало частину стабільних контрактів для auth token, collection validation і not-found mutation paths.
- Через це частина реальних 401/400/404 регресій могла пройти непоміченою до пізніших стадій smoke/debug.

## Що зроблено

- Розширено `scripts/verify-api-error-contract.mjs` з 3 до 8 deterministic перевірок:
  - `invalidCredentials` → `401 AUTH_INVALID_CREDENTIALS`;
  - `invalidToken` → `401 AUTH_INVALID_TOKEN`;
  - `collectionValidation` → `400 VALIDATION_FAILED` + перевірка наявності `details.fieldErrors`;
  - `collectionItemNotFound` → `404 COLLECTION_ITEM_NOT_FOUND` + перевірка `meta.type/meta.id`;
  - `contactRequestNotFound` → `404 CONTACT_REQUEST_NOT_FOUND` + перевірка `meta.id`;
  - збережено існуючі `authRequired`, `settingsValidation`, `apiRouteNotFound`.
- Розширено `scripts/test-verify-api-error-contract.mjs`:
  - додано mock endpoints для `/api/auth/me`, `/api/releases` (POST), `/api/releases/:id` (PUT), `/api/contact-requests/:id` (PATCH);
  - оновлено happy-path асерти під нові checks;
  - додано новий негативний кейс `invalid-token-mismatch` для fail-fast перевірки нового сценарію.
- Orchestration local/CI gate не змінювалась: інтеграція вже існувала і продовжує працювати з розширеними скриптами.

## Що покращило/виправило/додало

- Підвищено надійність pre-release перевірки контракту помилок без зміни backend бізнес-логіки.
- Закрито coverage-gap по стабільних 401/400/404 шляхах, які часто ламаються при рефакторингу auth/collections/contact.
- Зменшено ризик silent-drift у payload shape (`code/error/details/meta`) між релізами.
- Збережено non-flaky характер батчу: time-dependent 429/503 сценарії свідомо винесені в окремий наступний етап.
