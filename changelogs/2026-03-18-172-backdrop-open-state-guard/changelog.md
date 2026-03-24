# Changelog #172: Open-state guard for unsaved modal backdrop handler

`handleSettingsUnsavedBackdropClick(event)` не перевіряв явно, чи модалка ще відкрита.
У рідкісних таймінгових сценаріях застарілий click-event міг зайти в обробник після приховування модалки.

Додано early-return на початку `handleSettingsUnsavedBackdropClick(event)`:

- `if (!isSettingsUnsavedModalOpen()) return;`

Інші guard-и (`defaultPrevented`, primary button, target id) залишено без змін.

Більш передбачувана поведінка backdrop-обробника в edge/race сценаріях.
Менше ризику обробки застарілих кліків, коли модалка вже закрита.

Diagnostics:

- `admin.js`: no errors
- `admin.html`: no errors

Grep confirmation:

- `function handleSettingsUnsavedBackdropClick(event)` присутня
- `if (!isSettingsUnsavedModalOpen()) return;` присутній у backdrop handler

Smoke API:

- `settingsOk=True; okPage=1; okTotal=5; okItems=1`
