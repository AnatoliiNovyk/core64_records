# 2026-04-16-25 Neon Bootstrap Admin Init

## Як було

- Новий Neon проект існував, але схема була порожня (без таблиць), тому API не мав робочої структури даних.
- Прод API уже відповідав з Neon, але smoke перевірка падала на `AUTH_ADMIN_NOT_INITIALIZED`.
- Операція оновлення `DATABASE_URL` у GCP Secret Manager була недоступна для поточного активного акаунта через IAM `secretmanager.versions.add` denied.

## Що зроблено

- Локальний backend перемкнено на Neon pooler URL у `backend/.env` з strict SSL (`DB_SSL_REJECT_UNAUTHORIZED=true`, `DB_SSL_ALLOW_SELF_SIGNED=false`).
- Виконано `npm run migrate` у `backend/` проти Neon; застосовано міграції `001_init.sql` ... `017_releases_release_type_remix.sql`.
- Ініціалізовано лише `admin_users` і базовий запис `settings` окремим one-shot скриптом без запуску повного `seed` (щоб не додавати демо релізи/артистів/події).
- Перевірено локальні endpoint-и:
- `GET /api/health` -> `200`.
- `GET /api/health/db` -> `200`.
- `GET /api/public?lang=uk` -> `200` (дані порожні колекції, як очікувано після bootstrap без імпорту контенту).
- Перевірено прод endpoint-и:
- `GET /api/health` -> `200`.
- `GET /api/health/db` -> `200`.
- Запущено `scripts/smoke-check.mjs` для прод; базові перевірки пройдено, admin flow розблоковано після ініціалізації.

## Що покращило/виправило/додало

- Neon база стала технічно готовою до роботи backend (схема створена, підключення стабільне).
- Адмін-авторизація перестала падати через відсутність `admin_users`.
- Збережено чистий каталог без автоматичного демо-контенту, щоб уникнути повторної підміни «не своїми» даними.
- Зафіксовано блокер на рівні IAM для ротації Secret Manager (`DATABASE_URL`) з поточного акаунта, що дає чіткий наступний крок для прав доступу.
