# Changelog - 2026-03-17 - Audit refresh success pulse

Додано коротку візуальну підсвітку секції аудиту після успішного ручного оновлення.
Ефект застосовується для обох сценаріїв:

- `Оновити зараз`
- `Форс-оновлення`

Файл: `admin.js`
Додано стан:

- `auditRefreshHighlightTimer`

Додано функцію:

- `pulseAuditRefreshSuccess()`

Логіка:

- на `#section-audit` тимчасово додається ring/highlight (`emerald`) на 450ms;
- попередній таймер очищається, щоб не було накладання анімацій.

Інтеграція:

- виклик `pulseAuditRefreshSuccess()` після успішного `await loadAuditLogs()` в `refreshAuditNow()`;
- аналогічно в `forceRefreshAuditNow()`.

Статична перевірка:

- `admin.js`: без помилок

Smoke API:

- `okPage=1; okTotal=5; okItems=1`

Після ручного оновлення користувач отримує швидкий візуальний фідбек, що дані аудиту успішно синхронізовані.
