# Changelog - 2026-03-17 - Audit latency threshold sync

## Що зроблено
- Централізовано пороги latency у `admin.js` (`300/800ms`) для уникнення розсинхрону між tooltip, індикатором і legend.
- Додано рендер легенди на основі цих констант при завантаженні адмінки.
- Текст середньої затримки переведено на використання константи розміру історії (`AUDIT_LATENCY_HISTORY_SIZE`).

## Технічні зміни
- Файл: `admin.js`
  - Додано константи:
    - `AUDIT_LATENCY_GOOD_MAX_MS`
    - `AUDIT_LATENCY_WARN_MAX_MS`
  - Додано helper-функції:
    - `getAuditLatencyThresholdHint()`
    - `renderAuditLatencyLegend()`
  - Оновлено `updateAuditLatencyIndicator(avgMs)`:
    - порівняння виконуються через константи, а не хардкод.
  - У `DOMContentLoaded` додано виклик `renderAuditLatencyLegend()`.
  - У `loadAuditLogs()` підпис середнього latency формує текст через `AUDIT_LATENCY_HISTORY_SIZE`.

- Файл: `admin.html`
  - Додано ID для елементів легенди:
    - `audit-latency-legend-good`
    - `audit-latency-legend-warn`
    - `audit-latency-legend-slow`

## Валідація
- Статичні перевірки:
  - `admin.html`: без помилок
  - `admin.js`: без помилок
- Smoke API:
  - `okPage=1; okTotal=5; okItems=1`

## Результат
- Пороги latency тепер підтримуються з одного джерела, що спрощує подальше тюнінгування і зменшує ризик UI-розсинхрону.
