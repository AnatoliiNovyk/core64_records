# 2026-04-16-28 Pre-Release Secret-First Admin Password

## Як було

- У CI workflow `Pre-Release Gate` і `Smoke Check` admin password передавався як обов'язковий `workflow_dispatch` input `core64_admin_password`.
- Це створювало зайвий ризик для ручного запуску, бо чутливе значення передавалось через форму запуску workflow.
- Документація та runbook описували `core64_admin_password` як обов'язковий input.

## Що зроблено

- Для `.github/workflows/pre-release-gate.yml` реалізовано dual-mode secret-first резолв admin password:
- primary: repository secret `CORE64_ADMIN_PASSWORD`
- fallback: input `core64_admin_password` (deprecated)
- Додано окремий крок `Resolve admin password source` з `::add-mask::` і fail-fast при відсутності обох джерел.
- Усі runtime-кроки pre-release gate переведені на резолвене значення `CORE64_ADMIN_PASSWORD` через `GITHUB_ENV` замість прямого читання input.
- Для `.github/workflows/smoke-check.yml` реалізовано той самий secret-first dual-mode підхід.
- У `scripts/pre-release-gate-local.ps1` покращено прозорість без витоку секрету:
- `Resolve-AdminPassword` тепер повертає і пароль, і source metadata
- Додано безпечний лог джерела пароля без друку значення
- Додано warning при використанні default-джерел.
- Оновлено документацію:
- `README.md` (CI Smoke Automation + CI Unified Pre-Release Gate)
- `RELEASE_RUNBOOK.md` (CI alternative для Pre-Release Gate).

## Що покращило/виправило/додало

- Зменшено ризик витоку admin password у CI-процесі завдяки secret-first моделі.
- Збережено зворотну сумісність на перехідний період через fallback input.
- Вирівняно поведінку між `Pre-Release Gate` та `Smoke Check`, щоб уникнути security drift.
- Поліпшено діагностику локального gate-запуску без розкриття секретів.
