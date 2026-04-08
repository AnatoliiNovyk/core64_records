# 2026-04-09-06 Markdownlint Cleanup And MSSQL Diagnostics Tuning

## Як було

- Частина changelog-файлів за 2026-04-08 мала порушення правил markdownlint (`MD041`, `MD022`, `MD032`).
- У VS Code показувались mssql синтаксичні помилки для PostgreSQL-міграції `013_section_settings_contact_nav_title_and_hero_subtitle.sql`, бо T-SQL parser не сумісний з Postgres-діалектом.

## Що зроблено

- Нормалізовано формат changelog-файлів:
  - `changelogs/2026-04-08-08-admin-dashboard-i18n-fix.md`
  - `changelogs/2026-04-08-09-admin-sections-headings-buttons-i18n.md`
  - `changelogs/2026-04-08-10-admin-settings-i18n-fix.md`
  - `changelogs/2026-04-08-11-admin-requests-i18n-fix.md`
  - `changelogs/2026-04-08-12-admin-audit-i18n-fix.md`
  - `changelogs/2026-04-08-13-admin-date-locale-en-polish.md`
  - `changelogs/2026-04-08-14-admin-requests-audit-date-format-controlled.md`
- Для файлів `13` і `14` додано top-level H1 на першому рядку (виправлення `MD041`).
- Для всіх перелічених файлів додано коректні порожні рядки навколо заголовків і списків (виправлення `MD022` і `MD032`).
- Додано workspace-конфіг `/.vscode/settings.json` для цього репозиторію:
  - `mssql.intelliSense.enableErrorChecking = false`
  - `mssql.autoDisableNonTSqlLanguageService = true`

## Що покращило/виправило/додало

- Прибрано markdownlint-шум у changelog-файлах, структура документів стала консистентною.
- Зменшено кількість хибних mssql-діагностик для PostgreSQL-міграцій у VS Code.
- Полегшено огляд реальних проблем у Problems panel без зміни SQL-логіки чи міграцій.
