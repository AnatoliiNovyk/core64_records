# 508 Batch - Deploy migrate preflight and retry hardening

## Як було

- Крок `Run database migration/seed` у deploy workflow падав відразу на першій transient DB помилці (`Connection terminated due to connection timeout`, `Connection terminated unexpectedly`, TLS chain issues).
- Перед запуском `npm run migrate` у цьому кроці не друкувався strict preflight policy/snapshot для `DATABASE_URL`.
- Timeout параметри БД з workflow inputs не проброшувались явно у migrate/seed step.

## Що зроблено

- Оновлено [deploy workflow](.github/workflows/deploy-google-run.yml) у кроці міграцій:
  - додано strict preflight перевірку:
    - `scripts/check-database-url-policy.mjs --strict`
    - `scripts/print-db-target-snapshot.mjs --strict`
  - додано проброс timeout env vars у step:
    - `DB_CONNECTION_TIMEOUT_MS`
    - `DB_QUERY_TIMEOUT_MS`
    - `DB_STATEMENT_TIMEOUT_MS`
  - додано helper `retry_db_command` (до 3 спроб) для `npm run migrate` і `npm run seed`.
- Retry спрацьовує лише для transient-помилок за лог-патернами:
  - `Connection terminated due to connection timeout`
  - `Connection terminated unexpectedly`
  - `SELF_SIGNED_CERT_IN_CHAIN`

## Що покращило

- Зменшено flaky-failures деплою через короткоживучі мережеві/транспортні збої до БД.
- Поліпшено діагностику перед міграцією за рахунок safe strict preflight metadata.
- Уніфіковано DB timeout конфіг у migrate/seed кроці з workflow inputs.
