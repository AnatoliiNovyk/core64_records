# Changelog 2026-03-17 #09 - Migration success

## Як було
- Міграція не проходила через TLS/SSL конфлікт налаштувань.

## Що було зроблено
- Повторно запущено `npm --prefix backend run migrate` після правки `DATABASE_URL`.
- Міграцію виконано успішно: `Migration applied: 001_init.sql`.

## Що це покращило, виправило, додало
- Виправило блокер етапу DB bootstrap.
- Додало в БД початкову схему таблиць (`admin_users`, `releases`, `artists`, `events`, `settings`, `contact_requests`).
- Відкрило можливість перейти до `seed` і smoke-тестів API.
