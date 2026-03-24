# Changelog #175: try/catch guard for modal focus restoration

У `resolveSettingsUnsavedNavigation(action)` після `isConnected` перевірки викликався `previous.focus()` без локального `try/catch`.
У рідкісних браузерних edge-сценаріях `focus()` може кидати виняток.

Обгорнуто `previous.focus()` в `try/catch` у блоці restore-focus.
При винятку помилка ігнорується, щоб не переривати flow закриття модалки.

Вища стійкість close-flow до рідкісних винятків фокусування.
Менший ризик, що помилка фокусу вплине на подальшу роботу інтерфейсу.

Diagnostics:

- `admin.js`: no errors
- `admin.html`: no errors

Grep confirmation:

- `function resolveSettingsUnsavedNavigation(action)` присутня
- `previous.focus()` обгорнуто в `try/catch`

Smoke API:

- `settingsOk=True; okPage=1; okTotal=5; okItems=1`
