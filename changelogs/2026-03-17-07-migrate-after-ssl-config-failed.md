# Changelog 2026-03-17 #07 - Migrate after SSL config (failed)

## Як було
- Після SSL-правок очікувалось, що `migrate` пройде.

## Що було зроблено
- Запущено `npm --prefix backend run migrate`.
- Отримано ту саму помилку: `SELF_SIGNED_CERT_IN_CHAIN`.

## Що це покращило, виправило, додало
- Додало точну діагностику: параметр `sslmode=require` в `DATABASE_URL` і далі форсує перевірку ланцюжка сертифікатів у поточній версії драйвера.
- Звузило next step: прибрати `sslmode` з URL і керувати SSL виключно через `Pool.ssl`.
