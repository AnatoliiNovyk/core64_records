# 2026-04-17-17 Deploy Workflow Candidate Cutover Preflight

## Як було

- Deploy workflow (`.github/workflows/deploy-google-run.yml`) не мав окремого механізму для strict preflight кандидатного `DATABASE_URL` до runtime config validation і DB migrate/seed кроків.
- Для cutover-сценаріїв перевірка кандидатної DB-цілі в CI залишалась зовнішнім або ручним кроком.

## Що зроблено

- У deploy workflow додано новий optional input:
- `cutover_candidate_database_url`
- У `Validate deploy inputs` додано валідацію:
- якщо input заданий, він має починатися з `postgres://` або `postgresql://`.
- Додано новий умовний крок:
- `Run candidate Postgres cutover preflight`
- крок запускається лише коли `cutover_candidate_database_url` непорожній;
- маскує значення через `::add-mask::`;
- виконує `node scripts/check-postgres-cutover-readiness.mjs --strict`.
- Оновлено `GOOGLE_RUN_DEPLOYMENT.md` з описом нового optional workflow input.

## Що покращило/виправило/додало

- Додано fail-fast preflight для deploy-cutover сценарію ще до runtime validation і міграцій.
- Зменшено ризик деплою з недосяжною або некоректною кандидатною DB-ціллю.
- Покращено операційну узгодженість: cutover preflight тепер доступний у локальному gate, pre-release CI і deploy workflow.
