# 514 Batch - DATABASE_URL encoding validation guard

## Як було

- Локальний/CI `DATABASE_URL` міг містити не-encoded спецсимволи в паролі (`@`, `#`), що ламало parse/auth і проявлялось як `DB_UNAVAILABLE` або `28P01`.
- Поточна config валідація перевіряла наявність `DATABASE_URL`, але не перевіряла URL-структуру і не давала прямої підказки про URL-encoding.

## Що зроблено

- Оновлено [backend/.env](backend/.env):
  - виправлено `DATABASE_URL` з URL-encoded паролем (`%40`, `%21`, `%23`).
- Оновлено [backend/src/config.js](backend/src/config.js):
  - додано `validateDatabaseUrl(...)` з перевірками:
    - валідний URL parse;
    - protocol `postgres://` або `postgresql://`;
    - наявний host;
    - наявна DB path (`/dbname`);
    - відсутній URL fragment/hash.
  - при помилці повертається явна підказка про URL-encoding спецсимволів пароля.
- Оновлено [backend/.env.example](backend/.env.example):
  - додано коментар-попередження про необхідність URL-encoding спецсимволів у `DATABASE_URL`.

## Що покращило

- Проблеми з не-encoded паролем у `DATABASE_URL` відловлюються fail-fast на старті backend з actionable повідомленням.
- Зменшено ризик повторних auth/config інцидентів у локальному середовищі та CI.
