# Changelog #174: Direct-backdrop click guard for unsaved modal handler

`handleSettingsUnsavedBackdropClick(event)` вже перевіряв open-state, `defaultPrevented`, кнопку миші та id таргета.
У сценаріях спливання подій з внутрішніх елементів все ще корисно мати прямий guard на "клік саме по backdrop".

Додано перевірку в backdrop handler:

- `if (event.currentTarget && event.target !== event.currentTarget) return;`

Інша логіка закриття модалки без змін.

Більш сувора й передбачувана обробка лише прямих кліків по backdrop.
Менший ризик, що внутрішній клік (через bubbling) вплине на cancel-flow.

Diagnostics:

- `admin.js`: no errors
- `admin.html`: no errors

Grep confirmation:

- `function handleSettingsUnsavedBackdropClick(event)` присутня
- `event.currentTarget && event.target !== event.currentTarget` присутній в обробнику

Smoke API:

- `settingsOk=True; okPage=1; okTotal=5; okItems=1`
