# Changelog #169: Repeat guard for Escape branch in unsaved modal keyboard handler

`handleSettingsUnsavedModalKeyboard(event)` обробляв Escape без окремого ignore для `event.repeat`.
При утриманні Escape автоповтор keydown міг повторно заходити в cancel-гілку.

У Escape-гілці modal handler додано:

- `if (event.repeat) return;`

Інша логіка modal keyboard trap не змінювалась.

Менше повторних cancel-trigger при утриманні Escape.
Стабільніша keyboard-поведінка модалки в умовах автоповтору клавіші.

Diagnostics:

- `admin.js`: no errors
- `admin.html`: no errors

Grep confirmation:

- `function handleSettingsUnsavedModalKeyboard(event)` присутня
- в Escape-гілці присутній `if (event.repeat) return;`

Smoke API:

- `settingsOk=True; okPage=1; okTotal=5; okItems=1`
