# 2026-04-20-230 — Remove Postgres Legacy Surface

## Як було

- Після Firestore-only cutover у runtime ще залишались історичні Postgres-артефакти в кодовій базі (`pool`, `repository`, SQL migration/seed/migrate файли).
- `backend/package.json` все ще містив залежність, пов'язану зі старою SQL-гілкою.

## Що зроблено

- Видалено legacy Postgres-файли з `backend/src/db/`:
  - `pool.js`
  - `repository.js`
  - `migrate.js`
  - `seed.js`
  - каталог `migrations/` з SQL-міграціями.
- У `backend/package.json` прибрано невикористану залежність `bcryptjs` після видалення SQL-auth/seed поверхні.
- Раніше видалений `backend/scripts/cleanup-inline-assets.mjs` лишився прибраним як Neon-специфічний operational script.

## Що покращило / виправило / додало

- З репозиторію прибрано залишкову Postgres/Neon поверхню, яка могла провокувати повернення до змішаного режиму.
- Firestore-only архітектура стала консистентною не лише в runtime, а й у файловій структурі backend.
- Спрощено підтримку: менше мертвого коду і менше неактуальних точок входу.
