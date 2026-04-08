# Changelog 2026-04-08 #03 - Post Deploy Smoke Summary Prompt

## Як було

- Була лише передрелізна шаблонізація через prompt `release-gate.prompt.md`.
- Не було окремого prompt для стандартизованого післядеплойного smoke-підсумку.

## Що було зроблено

- Додано новий prompt: `.github/prompts/post-deploy-smoke-summary.prompt.md`.
- Налаштовано frontmatter для discoverability:
  - `description`
  - `name`
  - `argument-hint`
  - `agent`
- Додано сценарій виконання:
  - API smoke (`node scripts/smoke-check.mjs`)
  - опційний UI smoke (`npm run ui-smoke:install`, `npm run ui-smoke`)
- Додано стандартизований формат результату:
  - Verdict
  - Environment
  - Checks
  - Blocking issues
  - Recommended action
- Додано посилання на runbook-документи замість дублювання процедур.

## Що це покращило, виправило, додало

- З’явився окремий повторно використовуваний сценарій для post-deploy валідації.
- Підвищено послідовність та швидкість операційного звітування після деплою.
- Зменшено ризик різночитань у GO/NO-GO оцінці стану прод-середовища.
