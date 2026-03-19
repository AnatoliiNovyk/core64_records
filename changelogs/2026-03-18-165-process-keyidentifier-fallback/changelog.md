# Changelog #165: Process keyIdentifier fallback in shared IME guard

## Було
- Shared guard `shouldIgnoreSettingsUnsavedKeydownEvent(event)` відсікав IME-події через `key`, `code`, `keyCode`, `which`, `isComposing`.
- У частині legacy WebKit-подій `Process` може передаватися в `keyIdentifier`.

## Зміна
- Додано fallback у shared guard:
  - `event.keyIdentifier === "Process"`
- Інша dismiss/modal логіка без змін.

## Стало краще
- Надійніша IME-детекція в старих WebKit/embedded сценаріях.
- Менше ризику хибного dismiss при IME-вводі, якщо `Process` приходить лише через `keyIdentifier`.

## Валідація
- Diagnostics:
  - `admin.js`: no errors
  - `admin.html`: no errors
- Grep confirmation:
  - `function shouldIgnoreSettingsUnsavedKeydownEvent(event)` присутня
  - умова містить `event.keyIdentifier === "Process"`
- Smoke API:
  - `settingsOk=True; okPage=1; okTotal=5; okItems=1`
