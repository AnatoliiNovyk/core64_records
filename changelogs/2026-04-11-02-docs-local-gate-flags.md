# Changelog 2026-04-11 #02 - Document local pre-release gate skip flags in README and runbook

## Як було
- Нові локальні флаги `pre-release-gate-local.ps1` вже існували у скрипті, але не були описані в основній документації.
- У README та RELEASE_RUNBOOK був тільки strict-приклад запуску з `GITHUB_TOKEN`, без офіційного tokenless/dev сценарію.

## Що було зроблено
- Оновлено `README.md`:
  - додано приклад tokenless/dev запуску локального gate з явними override-флагами;
  - додано блок Important з поясненням strict default та призначення skip-флагів.
- Оновлено `RELEASE_RUNBOOK.md`:
  - додано розділ tokenless local/dev mode з конкретною командою запуску;
  - додано примітки про локальний характер skip-флагів і заборону їх для фінального production sign-off.
- Перевірено markdown diagnostics для обох файлів (без помилок).

## Що це покращило, виправило, додало
- Документація синхронізована з реальними можливостями скрипта локального gate.
- Зменшено ризик операційної плутанини між strict release-процесом і локальним dev-режимом.
- Команда отримала явні, відтворювані інструкції для tokenless локальних прогонів.
