# Changelog #160: Escape keyIdentifier fallback for legacy WebKit events

Helper `isSettingsUnsavedToastEscapeKey(event)` визначав Escape через `key`, `code`, `keyCode` і `which`.
У старіших WebKit/embedded реалізаціях клавіша може передаватись через `keyIdentifier`.

Додано `keyIdentifier` fallback у `isSettingsUnsavedToastEscapeKey(event)`:

- `keyIdentifier === "Escape"`
- `keyIdentifier === "U+001B"`

Решта dismiss/modal логіки не змінювалась.

Краща сумісність Escape-dismiss у застарілих WebKit-сценаріях.
Менший ризик пропуску Escape при неповному наборі полів keyboard event.

Diagnostics:

- `admin.js`: no errors
- `admin.html`: no errors

Grep confirmation:

- `function isSettingsUnsavedToastEscapeKey(event)` присутня
- `keyIdentifier === "Escape"` присутній
- `keyIdentifier === "U+001B"` присутній

Smoke API:

- `settingsOk=True; okPage=1; okTotal=5; okItems=1`
