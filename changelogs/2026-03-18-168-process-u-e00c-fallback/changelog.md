# Changelog #168: Legacy Process U+E00C fallback in shared IME guard

## Було
- Shared guard `shouldIgnoreSettingsUnsavedKeydownEvent(event)` вже враховував `Process` через `key`, `code`, `keyIdentifier`, `keyCode`, `which`.
- У частині старих WebKit реалізацій IME Process може приходити як `keyIdentifier = "U+E00C"`.

## Зміна
- Додано додатковий fallback у shared guard:
  - `event.keyIdentifier === "U+E00C"`
- Інша логіка dismiss/modal не змінювалась.

## Стало краще
- Краща сумісність IME-ignore шляху для застарілих WebKit клавіатурних подій.
- Менший ризик хибних dismiss-trigger, якщо Process приходить у форматі `U+E00C`.

## Валідація
- Diagnostics:
  - `admin.js`: no errors
  - `admin.html`: no errors
- Grep confirmation:
  - `function shouldIgnoreSettingsUnsavedKeydownEvent(event)` присутня
  - умова містить `event.keyIdentifier === "U+E00C"`
- Smoke API:
  - `settingsOk=True; okPage=1; okTotal=5; okItems=1`
