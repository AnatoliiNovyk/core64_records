# Changelog #156: Enter which fallback for dismiss keyboard helper

Helper `isSettingsUnsavedToastEnterKey(event)` визначав Enter через `event.key`, `event.code` і `event.keyCode`.
У частині legacy keyboard-event реалізацій Enter може приходити тільки в полі `which`.

Додано fallback у `isSettingsUnsavedToastEnterKey(event)`:

- `|| event.which === 13`

Основний dismiss flow не змінювався, розширено лише детекцію Enter.

Вища кросбраузерна/legacy сумісність keyboard dismiss.
Менший ризик пропуску Enter у старих або embedded рушіях.

Diagnostics:

- `admin.js`: no errors
- `admin.html`: no errors

Grep confirmation:

- `function isSettingsUnsavedToastEnterKey(event)` присутня
- `event.which === 13` присутній в Enter helper
- helper використовується в `isSettingsUnsavedToastDismissKey(event)`

Smoke API:

- `settingsOk=True; okPage=1; okTotal=5; okItems=1`
