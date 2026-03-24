# Changelog #161: Enter keyIdentifier fallback for legacy WebKit events

Helper `isSettingsUnsavedToastEnterKey(event)` визначав Enter через `key`, `code`, `keyCode`, `which`.
У старих WebKit/embedded сценаріях Enter може приходити як `keyIdentifier`.

Додано `keyIdentifier` fallback у `isSettingsUnsavedToastEnterKey(event)`:

- `keyIdentifier === "Enter"`
- `keyIdentifier === "U+000D"`

Логіку dismiss/modal flow не змінено.

Краща сумісність Enter-dismiss у застарілих WebKit реалізаціях.
Менший ризик пропуску Enter при неповному наборі полів keyboard event.

Diagnostics:

- `admin.js`: no errors
- `admin.html`: no errors

Grep confirmation:

- `function isSettingsUnsavedToastEnterKey(event)` присутня
- `keyIdentifier === "Enter"` присутній
- `keyIdentifier === "U+000D"` присутній

Smoke API:

- `settingsOk=True; okPage=1; okTotal=5; okItems=1`
