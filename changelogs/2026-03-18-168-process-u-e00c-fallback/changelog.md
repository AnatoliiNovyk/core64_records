# Changelog #168: Legacy Process U+E00C fallback in shared IME guard

Shared guard `shouldIgnoreSettingsUnsavedKeydownEvent(event)` вже враховував `Process` через `key`, `code`, `keyIdentifier`, `keyCode`, `which`.
У частині старих WebKit реалізацій IME Process може приходити як `keyIdentifier = "U+E00C"`.

Додано додатковий fallback у shared guard:

- `event.keyIdentifier === "U+E00C"`

Інша логіка dismiss/modal не змінювалась.

Краща сумісність IME-ignore шляху для застарілих WebKit клавіатурних подій.
Менший ризик хибних dismiss-trigger, якщо Process приходить у форматі `U+E00C`.

Diagnostics:

- `admin.js`: no errors
- `admin.html`: no errors

Grep confirmation:

- `function shouldIgnoreSettingsUnsavedKeydownEvent(event)` присутня
- умова містить `event.keyIdentifier === "U+E00C"`

Smoke API:

- `settingsOk=True; okPage=1; okTotal=5; okItems=1`
