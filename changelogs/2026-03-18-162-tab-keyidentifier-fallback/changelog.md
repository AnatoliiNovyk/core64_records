# Changelog #162: Tab keyIdentifier fallback for legacy WebKit events

Helper `isSettingsUnsavedTabKey(event)` визначав Tab через `key`, `code`, `keyCode`, `which`.
У старих WebKit/embedded сценаріях Tab може приходити через `keyIdentifier`.

Додано `keyIdentifier` fallback у `isSettingsUnsavedTabKey(event)`:

- `keyIdentifier === "Tab"`
- `keyIdentifier === "U+0009"`

Логіка modal focus-trap не змінена.

Краща сумісність Tab-навігації в модалці незбережених змін на legacy WebKit рушіях.
Менший ризик, що focus-trap пропустить Tab через неповний keyboard event.

Diagnostics:

- `admin.js`: no errors
- `admin.html`: no errors

Grep confirmation:

- `function isSettingsUnsavedTabKey(event)` присутня
- `keyIdentifier === "Tab"` присутній
- `keyIdentifier === "U+0009"` присутній

Smoke API:

- `settingsOk=True; okPage=1; okTotal=5; okItems=1`
