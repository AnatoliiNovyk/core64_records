# Changelog - 2026-03-17 - Audit skeleton loader

Додано рендер skeleton-карток для списку аудиту під час завантаження.
Інтегровано skeleton у lifecycle `loadAuditLogs()` через існуючий `setAuditLoading(true)`.
Додано `aria-busy` для контейнера списку аудиту (`#audit-list`) для кращої доступності.
Під час loading очищується блок пагінації, щоб не показувати застарілі кнопки.

Файл: `admin.js`
Нові/оновлені функції:

- `renderAuditSkeleton()`
- `setAuditLoading(isLoading)`

Перевірка помилок у `admin.js`: без помилок.
Smoke API audit endpoint:

- `okPage=1; okTotal=5; okItems=2`

UX секції аудиту став більш плавним: користувач бачить структурований loading-стан списку, а не лише текстовий індикатор.
