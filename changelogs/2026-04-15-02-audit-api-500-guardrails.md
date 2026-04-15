# Audit API 500 Guardrails

## Як було

- Endpoint `GET /api/audit-logs` повертав повний `details` для кожного запису.
- Для великих audit-подій (особливо з великим diff/settings payload) відповіді ставали надто важкими.
- При вищих `limit` це призводило до `500` і в адмінці показувався загальний банер помилки API.

## Що зроблено

- У `backend/src/routes/auditLogs.js` додано явні константи лімітів і server-side clamp для `limit`:
  - `AUDIT_LOGS_DEFAULT_LIMIT = 50`
  - `AUDIT_LOGS_MAX_LIMIT = 250`
- У `backend/src/db/repository.js` для `listAuditLogs` замінено видачу повного `details` на компактну проєкцію `details` (summary):
  - `isCompact`
  - `source` (обрізаний)
  - `hasDiff`
  - `settingsChangedCount`
  - `sectionsChangedRowCount`
  - для не-об'єктних payload додано `valuePreview`.

## Що покращило/виправило/додало

- Значно зменшено розмір відповіді Audit API для великих подій.
- Прибрано основний тригер `500` для завеликих payload у списку аудиту.
- Збережено backend-only підхід без зміни схем БД і без втручання у фронтенд-контракт списку.
