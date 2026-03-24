# Changelog #181: Add focus-function guard in modal focus-restore callback

У `resolveSettingsUnsavedNavigation()` перед плануванням RAF вже перевірялось, що `settingsUnsavedModalPreviousFocus.focus` є функцією.
Проте між плануванням і виконанням callback обʼєкт таргета теоретично міг змінитися.

У RAF callback додано повторний guard:

- `if (typeof previous.focus !== "function") return;`

Інші умови (`isConnected`, containment check, `try/catch`) залишено без змін.

Додатковий захист від рідкісних mutation/race edge-cases між кадрами.
Без зміни UX і без зміни логіки маршруту дій модалки.

Diagnostics:

- `admin.js`: no errors
- `admin.html`: no errors

Grep confirmation:

- у focus-restore callback присутній `typeof previous.focus !== "function"`

Smoke API:

- `settingsOk=True; okPage=1; okTotal=5; okItems=1`
