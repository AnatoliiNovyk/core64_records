# 2026-04-17-23 Pre Release Gate Api Contract Order And Auth Attempts

## Як було

- У `pre-release-gate.yml` крок `Run API error contract check` виконувався після `Run smoke-check`.
- `smoke-check` перед цим вже робив серію мутаційних запитів і міг наситити in-memory rate-limit в рантаймі.
- Через це API contract інколи падав false-negative (наприклад, `COLLECTIONS_RATE_LIMITED` замість очікуваного `COLLECTION_ITEM_NOT_FOUND`), а auth rate-limit міг не встигати спостерігатися за 12 спроб.

## Що зроблено

- У `.github/workflows/pre-release-gate.yml` переставлено порядок кроків:
- `Run API error contract check` тепер виконується одразу після optional candidate preflight і до `Run smoke-check`.
- Для цього кроку додано `CORE64_CONTRACT_AUTH_RATE_LIMIT_ATTEMPTS="30"`.

## Що покращило/виправило/додало

- Зменшено вплив попередніх smoke-мутацій на API error contract перевірку.
- Підвищено стабільність спостереження `AUTH_RATE_LIMITED` у розподіленому CI runtime.
- Gate дає чистіший сигнал по контракту помилок і менше false-negative падінь.
