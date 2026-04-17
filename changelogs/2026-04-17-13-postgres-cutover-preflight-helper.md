# 2026-04-17-13 Postgres Cutover Preflight Helper

## Як було

- Для переходу з Neon на інший Postgres не було окремого технічного preflight інструменту, який можна запустити до ротації `DATABASE_URL`.
- Команда могла перевірити політику URL і робити smoke після деплою, але не мала єдиної автоматизованої перевірки кандидатної цілі на рівні URL policy + DNS + TCP до cutover.

## Що зроблено

- Додано новий helper: `scripts/check-postgres-cutover-readiness.mjs`.
- Helper виконує:
- policy валідацію `DATABASE_URL` через існуючий `evaluateDatabaseUrlPolicy`;
- безпечний snapshot цілі (protocol/host/port/database/sslmode без credentials);
- DNS probe для host;
- TCP probe для host:port з контрольованим timeout (`--timeout-ms`, default 5000).
- Додано strict режим (`--strict`): якщо preflight не повністю зелений, скрипт завершується з `exit 1`.
- Додано self-test: `scripts/test-check-postgres-cutover-readiness.mjs` (локальний TCP success, invalid URL, unreachable TCP).
- Оновлено root `package.json` scripts:
- `db-cutover:preflight`
- `db-cutover:preflight:test`
- Оновлено runbook-и з обов'язковим preflight кроком перед ротацією `DATABASE_URL`:
- `RELEASE_RUNBOOK.md`
- `GOOGLE_RUN_DEPLOYMENT.md`

## Що покращило/виправило/додало

- Додано ранній fail-fast бар'єр перед cutover: помилки URL policy, DNS і мережевої досяжності виявляються до деплою/трафік-світчу.
- Знижено операційний ризик під час виходу з Neon: команда отримала стандартний і відтворюваний preflight процес.
- Покращено відладку інцидентів cutover: structured JSON вихід містить `status`, `checks`, `hint` і технічні коди помилок для швидкого triage.
