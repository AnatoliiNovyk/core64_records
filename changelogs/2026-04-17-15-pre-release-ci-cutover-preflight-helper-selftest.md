# 2026-04-17-15 Pre-Release CI Cutover Preflight Helper Self-Test

## Як було

- Новий helper `scripts/check-postgres-cutover-readiness.mjs` вже мав локальний self-test та був інтегрований у локальний gate.
- У CI workflow `pre-release-gate.yml` цей self-test ще не запускався, тому між локальним і CI контурами була невелика розсинхронізація.

## Що зроблено

- Оновлено `.github/workflows/pre-release-gate.yml`.
- Додано окремий крок workflow:
- `Validate Postgres cutover preflight helper`
- Команда кроку:
- `node scripts/test-check-postgres-cutover-readiness.mjs`

## Що покращило/виправило/додало

- Досягнуто паритет локальних і CI self-test перевірок для нового cutover helper-а.
- Знижено ризик пропуску регресій у helper-логіці: тепер вони ловляться не лише локально, а й у стандартному pre-release CI gate.
- Підсилено стабільність release-процесу під сценарії ротації `DATABASE_URL`/cutover на інший Postgres.
