# 2026-04-17-11 Health Smoke Storage-Limit Hint

## Як було

- У `scripts/smoke-check.mjs` health-діагностика вже виводила `kind/dbCode/duration/target`, але для `kind=storage_limit` не було окремої actionable-підказки.
- Під час production деградації з `DB_STORAGE_LIMIT_REACHED` оператору доводилося інтерпретувати поля вручну, без прямого next-step у `checks.healthDb.hint`.

## Що зроблено

- У `scripts/smoke-check.mjs` в `deriveHealthDbHint(...)` додано явний кейс для storage-limit:
- `normalizedKind === "storage_limit"` або `dbCode === "53100"`;
- повертається пряма інструкція: відновити quota/оновити план БД і повторити health/full smoke.
- Виконано валідацію після правки:
- `node scripts/test-smoke-check.mjs` -> `PASSED`;
- production health-mode smoke (локальним скриптом проти live API) показав новий `checks.healthDb.hint` для `DB_STORAGE_LIMIT_REACHED`.

## Що покращило/виправило/додало

- Інцидентний triage став швидшим: у JSON smoke-звіті одразу є конкретний next action для storage-limit кейсу без додаткового лог-аналізу.
- Менше ризику хибної інтерпретації quota-проблеми як мережевої/TLS помилки.
- Підвищено операційну зручність повторних health/full перевірок після відновлення квоти БД.
