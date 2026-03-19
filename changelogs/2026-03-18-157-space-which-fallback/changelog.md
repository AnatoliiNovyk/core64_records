# Changelog #157: Space which fallback for dismiss keyboard helper

## Було
- Helper `isSettingsUnsavedToastSpaceKey(event)` визначав Space через `event.key`, `event.code` і `event.keyCode`.
- У частині legacy keyboard-event реалізацій Space може приходити тільки в полі `which`.

## Зміна
- Додано fallback у `isSettingsUnsavedToastSpaceKey(event)`:
  - `|| event.which === 32`
- Логіка dismiss flow не змінювалась; розширено лише детекцію клавіші Space.

## Стало краще
- Вища сумісність keyboard dismiss у старих/embedded браузерних рушіях.
- Менший ризик пропуску Space при неповних `key`/`code` значеннях.

## Валідація
- Diagnostics:
  - `admin.js`: no errors
  - `admin.html`: no errors
- Grep confirmation:
  - `function isSettingsUnsavedToastSpaceKey(event)` присутня
  - `event.which === 32` присутній у Space helper
  - helper використовується в `isSettingsUnsavedToastDismissKey(event)`
- Smoke API:
  - `settingsOk=True; okPage=1; okTotal=5; okItems=1`
