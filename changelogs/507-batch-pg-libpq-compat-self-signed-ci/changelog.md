# 507 Batch - pg libpq compat for self-signed CI flow

## Як було

- У CI міграція могла падати з `SELF_SIGNED_CERT_IN_CHAIN` навіть при `DB_SSL_REJECT_UNAUTHORIZED=false` і `DB_SSL_ALLOW_SELF_SIGNED=true`.
- Причина: `pg-connection-string` v2 трактує `sslmode=require`/`verify-ca` як verify-full-поведінку без libpq compat.

## Що зроблено

- Оновлено [backend/src/db/pool.js](backend/src/db/pool.js):
  - додано `buildEffectiveConnectionString(...)` для побудови runtime URL;
  - якщо одночасно виконуються умови:
    - `DB_SSL=true`
    - `DB_SSL_REJECT_UNAUTHORIZED=false`
    - `DB_SSL_ALLOW_SELF_SIGNED=true`
    - `sslmode=require` або `sslmode=verify-ca`
    - відсутній `uselibpqcompat=true`
  - тоді до runtime URL автоматично додається `uselibpqcompat=true`.
- Додано warn-повідомлення в лог для прозорості runtime-adjustment.

## Що покращило

- Знижено ризик падіння міграцій/підключення через TLS self-signed chain у CI self-signed режимі.
- Збережено strict policy по `sslmode` у секреті, але додано сумісну runtime-семантику для поточної версії `pg`/`pg-connection-string`.
