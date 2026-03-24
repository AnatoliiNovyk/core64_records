# Changelog #151: Enter keycode fallback for dismiss keyboard helper

Helper `isSettingsUnsavedToastEnterKey(event)` визначав Enter через `event.key` (`Enter`/`Return`) і `event.code` (`Enter`/`NumpadEnter`).
На старих/нестандартних keyboard-event реалізаціях Enter міг не ідентифікуватися стабільно, якщо `key`/`code` неповні.

Додано legacy fallback у `isSettingsUnsavedToastEnterKey(event)`:

- `|| event.keyCode === 13`

Поведінку основного dismiss flow не змінено; розширено лише детекцію клавіші Enter.

Краща сумісність keyboard dismiss для `settings-unsaved` toast на старих браузерних/вбудованих рушіях.
Менший ризик, що Enter не спрацює через неповні поля `key`/`code`.

Diagnostics:

- `admin.js`: no errors
- `admin.html`: no errors

Grep confirmation:

- `function isSettingsUnsavedToastEnterKey(event)` присутня
- `event.keyCode === 13` присутній в Enter helper
- helper використовується в `isSettingsUnsavedToastDismissKey(event)`

Smoke API:

- `settingsOk=True; okPage=1; okTotal=5; okItems=1`
