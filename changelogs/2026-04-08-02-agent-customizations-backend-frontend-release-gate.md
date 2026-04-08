# Changelog 2026-04-08 #02 - Agent Customizations Backend Frontend Release Gate

## Як було

- Існувала лише загальна workspace-інструкція для агента без area-specific інструкцій.
- Не було окремого prompt-файлу для стандартизованого запуску pre-release перевірок.

## Що було зроблено

- Додано backend-інструкцію: .github/instructions/backend.instructions.md.
  - Описано applyTo для backend/src, backend/.env, backend/package.json, migrations.
  - Зафіксовано правила API-контрактів, мапінгу snake_case/camelCase, year як string, та production guardrails.
- Додано frontend-інструкцію: .github/instructions/frontend.instructions.md.
  - Описано applyTo для admin/app/adapter/html/css файлів.
  - Зафіксовано DOM isConnected guards, auth-first bootstrap, sync admin/public settings.
- Додано prompt для релізного гейту: .github/prompts/release-gate.prompt.md.
  - Додано параметризацію вхідних даних та послідовність перевірок (env check, smoke, ui-smoke, local gate).
  - Додано стандартизований формат результату: Verdict, summary, blockers, next action.

## Що це покращило, виправило, додало

- Агенти тепер отримують точніші правила залежно від зони змін (backend або frontend), без зайвого шуму.
- Зменшено ризик регресій у критичних місцях (API-контракти, bootstrap-послідовність, DOM-safe патерни).
- Додано повторно використовуваний prompt для передрелізної валідації, що прискорює і стандартизує релізний процес.
