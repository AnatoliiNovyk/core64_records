# Changelog 2026-03-17 #06 - DB SSL config hardening

## Як було
- Підключення до Supabase падало з помилкою `SELF_SIGNED_CERT_IN_CHAIN`.
- SSL-поведінка не керувалась через env на рівні `pg` Pool.

## Що було зроблено
- Додано env-керування SSL у `backend/src/config.js`:
  - `DB_SSL`
  - `DB_SSL_REJECT_UNAUTHORIZED`
- Оновлено `backend/src/db/pool.js` для явної передачі `ssl`-опцій у `Pool`.
- Оновлено `backend/.env.example` новими SSL-змінними.
- Оновлено `backend/.env` значеннями:
  - `DB_SSL=true`
  - `DB_SSL_REJECT_UNAUTHORIZED=false`

## Що це покращило, виправило, додало
- Додало контрольований спосіб обійти TLS-блокер у dev-оточенні.
- Виправило архітектурну прогалину: SSL налаштовується конфігом, а не випадковою поведінкою рядка підключення.
- Додало прозорий шлях для подальшого переходу на stricter TLS в production.
