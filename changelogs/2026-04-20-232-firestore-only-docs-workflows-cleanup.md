# 2026-04-20-232 Firestore-Only Docs Workflows Cleanup

## Як було

- У проєкті залишались активні артефакти з Postgres/Neon/Supabase: документація, CI workflow, локальний pre-release gate, helper-скрипти, lock-записи skills.
- Deploy/rollback workflow все ще вимагали `DATABASE_URL`, DB cutover і Postgres helper-кроки.
- `README.md`, `GOOGLE_RUN_DEPLOYMENT.md`, `RELEASE_RUNBOOK.md` містили застарілі інструкції про міграції/seed, `DB_SSL` і Postgres cutover.

## Що зроблено

- Переписано документацію під Firestore-only:
  - `README.md`
  - `GOOGLE_RUN_DEPLOYMENT.md`
  - `RELEASE_RUNBOOK.md`
- Оновлено CI/CD workflow:
  - `.github/workflows/deploy-google-run.yml` переписано на Firestore-only.
  - `.github/workflows/rollback-google-run.yml` переписано на Firestore-only.
  - `.github/workflows/pre-release-gate.yml` очищено від Postgres cutover і `DATABASE_URL` helper-кроків.
- Оновлено локальні/службові інструкції:
  - `.github/copilot-instructions.md`
  - `.github/instructions/backend.instructions.md`
- Оновлено скрипти:
  - `scripts/check-google-run-env.ps1` переведено на Firestore-required змінні.
  - `scripts/pre-release-gate-local.ps1` очищено від Postgres cutover гілки і DB helper self-tests.
  - `scripts/smoke-check.mjs` оновлено під Firestore-підказки/діагностику.
- Видалено застарілі Postgres helper-скрипти та їх тести в `scripts/`.
- Видалено локальні skill-бандли `.agents/skills/*` для Neon/Supabase та очищено `skills-lock.json`.
- Оновлено `backend/src/config.js` (прибрано `DATABASE_URL`, `DB_SSL*`, `DB_*_TIMEOUT_MS` з активної конфігурації).
- Оновлено `backend/src/utils/dbError.js` (нейтральна SQLSTATE-нотація).
- Оновлено `package.json` (прибрано `db-cutover:*` scripts).

## Що покращило/виправило/додало

- Прибрано робочі шляхи, які вводили в оману та вели в неіснуючий Postgres runtime.
- Deploy/rollback і pre-release gate узгоджені з реальною Firestore-only архітектурою.
- Операційні підказки smoke/health приведені у відповідність до Firestore.
- Зменшено ризик помилкових релізних дій через застарілі env/secrets/checks.
