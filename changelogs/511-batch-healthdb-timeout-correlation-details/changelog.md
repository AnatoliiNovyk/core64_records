# 511 Batch - health/db timeout correlation details

## Як було

- У CI smoke при `healthDb.kind=timeout` була підказка з duration, але не було явного зв'язку з configured `DB_CONNECTION_TIMEOUT_MS`.
- У payload `health/db` не вистачало safe target metadata для швидкого зіставлення timeout-інциденту з фактичним DB endpoint.

## Що зроблено

- Оновлено [backend/src/routes/health.js](backend/src/routes/health.js):
  - `/health/db` тепер повертає safe `target` (host/port/database/sslmode + parse status) і `connectionTimeoutMs`;
  - у деградованому стані ці поля повертаються в `details`, у success — на верхньому рівні відповіді.
- Оновлено [scripts/smoke-check.mjs](scripts/smoke-check.mjs):
  - `checks.healthDb` тепер включає `connectionTimeoutMs` і `target`;
  - `deriveHealthDbHint` корелює `durationMs` з `connectionTimeoutMs` і дає сильніший network-root-cause hint, коли duration близька до configured timeout.
- Оновлено [README.md](README.md) у секції deploy diagnostics для опису нових safe полів `/api/health/db` у smoke output.

## Що покращило

- При повторюваних timeout-ах CI одразу показує, що duration впирається в configured timeout, і спрощує рішення: timeout tuning vs network/egress root-cause.
- Підвищено observability без витоку секретів.
