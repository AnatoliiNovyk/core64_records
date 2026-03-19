# Changelog #161: Enter keyIdentifier fallback for legacy WebKit events

## Було
- Helper `isSettingsUnsavedToastEnterKey(event)` визначав Enter через `key`, `code`, `keyCode`, `which`.
- У старих WebKit/embedded сценаріях Enter може приходити як `keyIdentifier`.

## Зміна
- Додано `keyIdentifier` fallback у `isSettingsUnsavedToastEnterKey(event)`:
  - `keyIdentifier === "Enter"`
  - `keyIdentifier === "U+000D"`
- Логіку dismiss/modal flow не змінено.

## Стало краще
- Краща сумісність Enter-dismiss у застарілих WebKit реалізаціях.
- Менший ризик пропуску Enter при неповному наборі полів keyboard event.

## Валідація
- Diagnostics:
  - `admin.js`: no errors
  - `admin.html`: no errors
- Grep confirmation:
  - `function isSettingsUnsavedToastEnterKey(event)` присутня
  - `keyIdentifier === "Enter"` присутній
  - `keyIdentifier === "U+000D"` присутній
- Smoke API:
  - `settingsOk=True; okPage=1; okTotal=5; okItems=1`
