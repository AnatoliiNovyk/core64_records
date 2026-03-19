# Changelog 2026-03-17 #08 - Remove sslmode from DATABASE_URL

## Як було
- `DATABASE_URL` містив `?sslmode=require`.
- Міграція падала з `SELF_SIGNED_CERT_IN_CHAIN`, навіть після SSL-правок у коді.

## Що було зроблено
- У `backend/.env` прибрано суфікс `?sslmode=require` із `DATABASE_URL`.

## Що це покращило, виправило, додало
- Усунуло конфлікт між параметрами URL і `Pool.ssl` у коді.
- Дозволяє керувати SSL централізовано через env-прапори (`DB_SSL`, `DB_SSL_REJECT_UNAUTHORIZED`).
- Підготувало правильні умови для повторної спроби міграції.
