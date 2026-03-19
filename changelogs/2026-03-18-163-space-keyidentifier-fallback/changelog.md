# Changelog #163: Space keyIdentifier fallback for legacy WebKit events

## Було
- Helper `isSettingsUnsavedToastSpaceKey(event)` визначав Space через `key`, `code`, `keyCode`, `which`.
- У старих WebKit/embedded сценаріях Space може приходити через `keyIdentifier`.

## Зміна
- Додано `keyIdentifier` fallback у `isSettingsUnsavedToastSpaceKey(event)`:
  - `keyIdentifier === "Spacebar"`
  - `keyIdentifier === "U+0020"`
- Загальна dismiss-логіка не змінена.

## Стало краще
- Краща сумісність Space-dismiss у legacy WebKit подіях.
- Менший ризик пропуску Space через неповний keyboard event payload.

## Валідація
- Diagnostics:
  - `admin.js`: no errors
  - `admin.html`: no errors
- Grep confirmation:
  - `function isSettingsUnsavedToastSpaceKey(event)` присутня
  - `keyIdentifier === "Spacebar"` присутній
  - `keyIdentifier === "U+0020"` присутній
- Smoke API:
  - `settingsOk=True; okPage=1; okTotal=5; okItems=1`
