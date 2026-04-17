# 2026-04-17-16 Pre-Release CI Candidate DB Cutover Preflight

## Як було

- CI workflow `Pre-Release Gate` мав лише self-test helper-а cutover preflight, але не міг виконати реальний strict preflight для конкретного кандидатного `DATABASE_URL`.
- Через це перевірка кандидатної цілі в CI залишалася ручною або локальною операцією.

## Що зроблено

- У `.github/workflows/pre-release-gate.yml` додано новий optional input:
- `core64_cutover_candidate_database_url`
- У валідацію input-ів додано перевірку:
- якщо input заданий, він має починатися з `postgres://` або `postgresql://`.
- Додано новий умовний крок CI:
- `Run candidate Postgres cutover preflight`
- крок запускається лише коли `core64_cutover_candidate_database_url` не порожній;
- перед запуском маскує значення (`::add-mask::`);
- виконує `node scripts/check-postgres-cutover-readiness.mjs --strict`.
- Оновлено `RELEASE_RUNBOOK.md` з інструкцією про новий optional CI input.

## Що покращило/виправило/додало

- CI отримав реальний fail-fast preflight для кандидатного cutover endpoint ще до smoke/contract перевірок.
- Зменшено ризик ротації на недосяжну або некоректну DB-ціль під час переходу з Neon.
- Посилено операційну повторюваність: тепер preflight можна запускати як у локальному gate, так і в CI з однаковою strict-логікою.
