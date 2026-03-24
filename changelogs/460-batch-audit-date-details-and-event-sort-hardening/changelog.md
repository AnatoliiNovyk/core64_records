# 460 Batch - Audit date/details and event sort hardening

як було:

- Сортування events використовувало direct `new Date(a.date) - new Date(b.date)` без fallback для invalid date.
- Audit render/export серіалізували `details` напряму через `JSON.stringify`, що могло падати на нестандартних об’єктах.
- Форматування часу в audit-картках було прямим і неуніфікованим.

що зроблено:

- Додано helper-и:
- `getComparableTimestamp(value)` — safe timestamp для сортування з fallback.
- `formatDateTimeOrDash(value)` — безпечне форматування дати/часу або `-`.
- `safeSerializeDetails(details, fallback)` — захищена серіалізація details з try/catch.
- `loadEvents`:
- сортування переведено на `getComparableTimestamp(...)` для стабільного порядку навіть при невалідних датах.
- `renderAuditLogs`:
- timestamp переведено на `formatDateTimeOrDash(...)`.
- details переведено на `safeSerializeDetails(...)`.
- `exportAuditCsv`:
- details у CSV переведено на `safeSerializeDetails(entry.details, "")`.

що покращило/виправило/додало:

- Знижено ризик runtime-помилок при рендері/експорті audit записів із нестандартним details payload.
- Підвищено стабільність сортування подій при некоректних/порожніх датах.
- Поведінка валідних сценаріїв залишилась сумісною.
