# 2026-04-16-26 Supabase To Neon Data Migration And Smoke Pass

## Як було

- Після bootstrap Neon схема існувала, але контентні таблиці були порожні.
- Прод API вже працював на Neon, але користувацькі дані (релізи/артисти/події/спонсори/треклісти/звернення/аудит) не були перенесені.
- Full smoke не проходив через mismatch admin credentials після часткового bootstrap.

## Що зроблено

- Відновлено доступ до старої Supabase БД через pooler (`uselibpqcompat=true`) і виконано повний перенос таблиць у Neon:
- `admin_users`, `settings`, `settings_i18n`
- `section_settings`, `section_settings_i18n`
- `releases`, `releases_i18n`
- `artists`, `artists_i18n`
- `events`, `events_i18n`
- `sponsors`, `sponsors_i18n`
- `release_tracks`, `contact_requests`, `audit_logs`
- Для цільової Neon БД виконано `TRUNCATE ... RESTART IDENTITY CASCADE`, імпорт даних і вирівнювання `id` sequence через `setval(...)`.
- Синхронізовано `admin_users.password_hash` з актуальним `ADMIN_PASSWORD` із Secret Manager, щоб прибрати 401 на `/auth/login`.
- Запущено і підтверджено:
- API smoke: `node scripts/smoke-check.mjs` -> `passed: true`.
- UI smoke: `npm run ui-smoke` -> `passed: true`.

## Що покращило/виправило/додало

- Реальні дані повернуті в Neon і доступні через прод API.
- Публічний фронтенд знову відображає релізи/артистів/події/спонсорів замість порожнього стану.
- Адмін-авторизація та post-deploy smoke стабільно проходять.
- Міграційний чекліст фактично закрито end-to-end, окрім окремого IAM-права `secretmanager.versions.add` для майбутніх ротацій `DATABASE_URL` (це не блокує поточну роботу прод-сервісу).
