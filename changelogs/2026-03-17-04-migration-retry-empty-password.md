# Changelog 2026-03-17 #04 - Migration retry with alternative URL

## Як було
- Перша спроба міграції завершилась `auth_failed (28P01)`.

## Що було зроблено
- Виконано повторну спробу `npm run migrate` з тимчасовим `DATABASE_URL=postgres://postgres@localhost:5432/core64`.
- PostgreSQL повернув помилку `client password must be a string`.

## Що це покращило, виправило, додало
- Підтвердило, що сервер PostgreSQL очікує парольну аутентифікацію (SCRAM).
- Уточнило, що для продовження потрібен валідний пароль/користувач у `DATABASE_URL`.
- Дало чіткий next step: отримати/встановити правильні credential'и БД.
