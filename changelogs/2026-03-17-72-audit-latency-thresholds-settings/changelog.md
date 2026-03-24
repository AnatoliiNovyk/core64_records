# Changelog - 2026-03-17 - Audit latency thresholds in settings

Додано керування порогами latency індикатора аудиту через секцію «Налаштування сайту».
Пороги тепер зберігаються в `settings` і автоматично застосовуються у tooltip, кольоровому індикаторі та легенді.
Додано валідацію: поріг `помірно` завжди більший за `добре` (за потреби значення автокоригується).

Файл: `admin.html`

- У `section-settings` додано поля:
- `setting-audit-latency-good-max`
- `setting-audit-latency-warn-max`
- Додано опис логіки для статусу `повільно`.

Файл: `admin.js`

- Додано runtime-стан порогів:
- `auditLatencyGoodMaxMs`
- `auditLatencyWarnMaxMs`
- Додано helper-функції:
- `parsePositiveMsValue(rawValue, fallback)`
- `applyAuditLatencyThresholds(settings)`
- `loadAuditLatencyThresholdsFromSettings()`
- `getAuditLatencyThresholdHint()`, `renderAuditLatencyLegend()`, `updateAuditLatencyIndicator()` переведені на runtime-пороги.
- У `DOMContentLoaded` додано завантаження порогів із `settings`.
- У `loadSettings()` підвантажуються значення порогів у поля форми.
- У `saveSettings()` пороги валідуються, зберігаються та одразу застосовуються до UI.

Статичні перевірки:

- `admin.js`: без помилок
- `admin.html`: без помилок

Smoke API:

- `settingsOk=True; okPage=1; okTotal=5; okItems=1`

Пороги latency стали керованими з адмінки без змін коду.
UI індикатора/легенди залишається синхронним після збереження налаштувань.
