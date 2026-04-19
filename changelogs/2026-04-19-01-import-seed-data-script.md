# 2026-04-19-01 — Import Seed Data Script via API

## Previous state
Не існувало жодного інструменту для автоматичного відновлення базових даних (releases, artists, events, sponsors) через API після перемикання БД або іншого інциденту. Відновлення потребувало ручної роботи через адмін-панель.

## What was changed
Створено скрипт `scripts/import-seed-data.mjs`:
- Аутентифікується через `POST /api/auth/login` → отримує JWT
- Перевіряє наявні записи через `GET /api/{type}` для кожної колекції
- Додає лише відсутні записи через `POST /api/{type}` (ідемпотентний)
- Підтримує `CORE64_API_BASE` (дефолт: `http://localhost:3000/api`) та `ADMIN_PASSWORD` (або з `backend/.env`)
- Виводить підсумок: `created` / `skipped` для кожної колекції

Дані відповідають `backend/src/db/seed.js`: 1 реліз, 1 артист, 1 подія, 3 спонсори.

Протестовано проти продакшн API (`https://core64.pp.ua/api`) — всі записи вже є, скрипт коректно пропустив їх.

## Resulting improvement
Тепер відновлення базових даних після інциденту (DB cutover, reset) відбувається за одну команду:
```
CORE64_API_BASE=https://core64.pp.ua/api ADMIN_PASSWORD=<password> node scripts/import-seed-data.mjs
```
Скрипт безпечний до повторного запуску (нічого не дублює).
