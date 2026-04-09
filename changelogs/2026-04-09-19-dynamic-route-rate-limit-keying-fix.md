# 2026-04-09-19 Dynamic Route Rate-Limit Keying Fix

## Як було

- У rate-limiter ключ будувався за фактичним шляхом запиту (`req.path`), тому dynamic маршрути з `:id` створювали окремий bucket на кожен id.
- Для admin mutation routes це дозволяло обхід ліміту через ротацію ідентифікаторів (наприклад, послідовні запити на різні `/releases/:id`).
- Opt-in 429 smoke покривав settings mutation, але не мав окремої regression-перевірки dynamic-id сценарію для collections.

## Що зроблено

- Оновлено keying у [backend/src/middleware/security.js](backend/src/middleware/security.js):
  - додано нормалізацію route scope (`method + baseUrl + route.path`);
  - ключ лімітера тепер стабільний для шаблону маршруту, а не для конкретного `:id` значення;
  - збережено поточний формат 429 відповіді (`code`, `error`) і `Retry-After`.
- Розширено opt-in перевірку в [scripts/smoke-check.mjs](scripts/smoke-check.mjs):
  - додано `runCollectionsDynamicRateLimitCheck(...)` для `PUT /releases/:id` з чергуванням різних id;
  - додано окремий блок звіту `admin.rateLimitCollectionsCheck` з деталями спроб, id, статусу, коду й `Retry-After`.
- Оновлено orchestration у [scripts/pre-release-gate-local.ps1](scripts/pre-release-gate-local.ps1) і [.github/workflows/pre-release-gate.yml](.github/workflows/pre-release-gate.yml):
  - додано параметри/inputs для керування `CORE64_SMOKE_RATE_LIMIT_COLLECTIONS_ATTEMPTS`;
  - додано валідацію цього параметра як цілого числа `>= 2`.

## Що покращило/виправило/додало

- Закрито обхід rate-limit для dynamic admin mutation routes через ротацію id.
- Додано детермінований regression-сценарій, який підтверджує 429 для collections mutation у межах одного route pattern.
- Посилено local/CI керованість перевірок: attempts для dynamic-id smoke тепер конфігуруються окремо без зміни стандартного smoke path.
