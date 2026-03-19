# Changelog #155: Escape which fallback for dismiss keyboard helper

## Було
- Helper `isSettingsUnsavedToastEscapeKey(event)` визначав Escape через `event.key`, `event.code` і `event.keyCode`.
- У частині legacy keyboard-event реалізацій Escape може передаватися тільки через поле `which`.

## Зміна
- Додано fallback у `isSettingsUnsavedToastEscapeKey(event)`:
  - `|| event.which === 27`
- Поведінку dismiss flow не змінено; розширено тільки детекцію Escape.

## Стало краще
- Підвищена сумісність keyboard dismiss для toast/modаl у старих або embedded браузерних рушіях.
- Менший ризик, що Escape не відпрацює через неповні `key`/`code` значення.

## Валідація
- Diagnostics:
  - `admin.js`: no errors
  - `admin.html`: no errors
- Grep confirmation:
  - `function isSettingsUnsavedToastEscapeKey(event)` присутня
  - `event.which === 27` присутній у Escape helper
  - helper використовується в `handleSettingsUnsavedModalKeyboard(event)`
- Smoke API:
  - `settingsOk=True; okPage=1; okTotal=5; okItems=1`
