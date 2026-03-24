# Changelog - 2026-03-17 - Audit force refresh

Додано окрему кнопку `Форс-оновлення` в тулбар секції аудиту.
Реалізовано обробник `forceRefreshAuditNow()` для негайного одноразового sync.
У звичайному (не eco) режимі форс-оновлення скидає countdown до повного інтервалу перед завантаженням.

Файл: `admin.html`

- Додано кнопку:
- `onclick="forceRefreshAuditNow()"`
- підпис: `Форс-оновлення`

Файл: `admin.js`

- Додано функцію `forceRefreshAuditNow()`:
- валідація діапазону дат;
- `resetAuditRefreshCountdown(refreshSeconds)` при активному інтервалі та вимкненому eco mode;
- виклик `loadAuditLogs()` з окремим fallback-повідомленням помилки.

Статичні перевірки:

- `admin.js`: без помилок
- `admin.html`: без помилок

Smoke API:

- `okPage=1; okTotal=5; okItems=1`

У користувача з'явився явний спосіб виконати миттєве оновлення аудиту незалежно від циклу автооновлення.
