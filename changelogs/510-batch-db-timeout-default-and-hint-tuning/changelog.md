# 510 Batch - DB timeout default and hint tuning

## Як було

- У deploy input `db_connection_timeout_ms` і backend fallback для `DB_CONNECTION_TIMEOUT_MS` використовувався дефолт `8000`.
- У post-deploy smoke при `healthDb.kind=timeout` підказка була загальною і не давала швидкого параметризованого next action.
- На практиці CI smoke показував стабільний timeout біля ~8000ms, що часто означає занадто агресивний connect timeout для поточного мережевого шляху.

## Що зроблено

- Оновлено [deploy workflow](.github/workflows/deploy-google-run.yml):
  - `db_connection_timeout_ms` default піднято з `8000` до `15000`.
- Оновлено [backend config](backend/src/config.js):
  - fallback для `DB_CONNECTION_TIMEOUT_MS` піднято з `8000` до `15000`.
- Оновлено [smoke-check hint](scripts/smoke-check.mjs):
  - для `kind=timeout` додано явну рекомендацію rerun з `db_connection_timeout_ms=15000 (or 20000)`.
- Оновлено [README.md](README.md):
  - у переліку deploy inputs default для `db_connection_timeout_ms` змінено на `15000`.

## Що покращило

- Зменшено ймовірність false-negative smoke fail через надто короткий DB connect timeout.
- Оператор у CI логу отримує конкретну дію для timeout-кейсу без додаткового аналізу.
- Узгоджено дефолти між workflow, backend runtime і документацією.
