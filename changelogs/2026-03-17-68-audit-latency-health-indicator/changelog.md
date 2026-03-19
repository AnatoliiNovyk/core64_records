# Changelog - 2026-03-17 - Audit latency health indicator

## Що зроблено
- Додано кольоровий індикатор якості latency для аудиту на базі rolling-average (останні 5 refresh).
- Індикатор складається з кольорової точки + забарвлення тексту метрики середнього часу.

## Технічні зміни
- Файл: `admin.html`
  - `#audit-avg-latency` перетворено на контейнер з:
    - `#audit-latency-dot` (точка-індикатор)
    - текстовий `span` для значення середнього часу.

- Файл: `admin.js`
  - Додано `updateAuditLatencyIndicator(avgMs)` з порогами:
    - `<= 300ms` — зелений (`emerald`)
    - `301..800ms` — жовтий (`amber`)
    - `> 800ms` — червоний (`red`)
    - fallback — сірий
  - Після обчислення average у `loadAuditLogs()`:
    - оновлюється текст `Середня (останні 5): N ms`
    - викликається `updateAuditLatencyIndicator(avg)`.

## Валідація
- Статичні перевірки:
  - `admin.js`: без помилок
  - `admin.html`: без помилок
- Smoke API:
  - `okPage=1; okTotal=5; okItems=1`

## Результат
- Якість продуктивності audit-refresh тепер читається “з першого погляду” через колірний сигнал, без потреби аналізувати лише числові значення.