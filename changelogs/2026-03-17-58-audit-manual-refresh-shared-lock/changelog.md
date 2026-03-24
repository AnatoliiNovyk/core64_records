# Changelog - 2026-03-17 - Audit manual refresh shared lock

Додано спільний lock для кнопок ручного оновлення аудиту.
Під час будь-якого ручного оновлення (`Оновити зараз` або `Форс-оновлення`) одночасно блокуються обидві кнопки.

Файл: `admin.js`
Додано функцію:

- `setManualAuditRefreshButtonsDisabled(isDisabled)`

Оновлено:

- `setRefreshNowButtonLoading(isLoading)`
- `setForceRefreshButtonLoading(isLoading)`

Обидві функції тепер використовують спільне блокування кнопок замість локального `button.disabled` тільки для однієї кнопки.

Статична перевірка:

- `admin.js`: без помилок

Smoke API:

- `okPage=1; okTotal=5; okItems=1`

Виключено паралельні ручні тригери оновлення аудиту з різних кнопок.
UX ручного оновлення став консистентним і передбачуваним.
