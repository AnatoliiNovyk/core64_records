# 2026-04-17-18 Rollback Workflow Candidate Cutover Preflight

## Як було

- Rollback workflow (`.github/workflows/rollback-google-run.yml`) не мав optional strict preflight для кандидатного `DATABASE_URL` перед post-rollback smoke перевіркою.
- Через це cutover-сценарії з rollback вимагали окремої ручної перевірки кандидатної DB-цілі.

## Що зроблено

- У rollback workflow додано новий optional input:
- `cutover_candidate_database_url`
- У `Validate rollback inputs` додано перевірку:
- якщо input заданий, він має починатися з `postgres://` або `postgresql://`.
- Оновлено умову `Setup Node.js`:
- крок запускається, якщо увімкнений `run_post_rollback_smoke` або заданий `cutover_candidate_database_url`.
- Додано новий умовний крок:
- `Run candidate Postgres cutover preflight`
- крок запускається лише коли `cutover_candidate_database_url` непорожній;
- маскує значення через `::add-mask::`;
- виконує `node scripts/check-postgres-cutover-readiness.mjs --strict`.
- Оновлено `GOOGLE_RUN_DEPLOYMENT.md` з описом нового optional rollback input.

## Що покращило/виправило/додало

- Додано fail-fast перевірку кандидатної DB-цілі для rollback-гілки ще до smoke-кроків.
- Зменшено операційний ризик rollback з некоректним або недосяжним кандидатним `DATABASE_URL`.
- Вирівняно cutover preflight-покриття між local gate, pre-release CI, deploy і rollback workflow.
