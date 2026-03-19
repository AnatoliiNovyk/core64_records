# Changelog #152: Space keycode fallback for dismiss keyboard helper

## Було
- Helper `isSettingsUnsavedToastSpaceKey(event)` визначав Space через `event.key` (`" "`, `"Space"`, `"Spacebar"`) та `event.code` (`"Space"`).
- У частині legacy-сценаріїв, де `key`/`code` можуть бути неповними, пробіл міг не розпізнаватись стабільно.

## Зміна
- Додано legacy fallback у `isSettingsUnsavedToastSpaceKey(event)`:
  - `|| event.keyCode === 32`
- Логіку dismiss flow не змінено; розширено лише детекцію клавіші пробілу.

## Стало краще
- Підвищена кросбраузерна сумісність keyboard dismiss для `settings-unsaved` toast.
- Зменшено ризик пропуску Space у старих/вбудованих рушіях keyboard events.

## Валідація
- Diagnostics:
  - `admin.js`: no errors
  - `admin.html`: no errors
- Grep confirmation:
  - `function isSettingsUnsavedToastSpaceKey(event)` присутня
  - `event.keyCode === 32` присутній у Space helper
  - helper використовується в `isSettingsUnsavedToastDismissKey(event)`
- Smoke API:
  - `settingsOk=True; okPage=1; okTotal=5; okItems=1`
