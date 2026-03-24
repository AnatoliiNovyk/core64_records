# Changelog #154: Tab which fallback for modal keyboard trap helper

Helper `isSettingsUnsavedTabKey(event)` визначав Tab через `event.key`, `event.code` і `event.keyCode`.
У legacy-сценаріях частина клавіатурних подій може приходити тільки через поле `which`.

Додано fallback у `isSettingsUnsavedTabKey(event)`:

- `|| event.which === 9`

Основна логіка `handleSettingsUnsavedModalKeyboard(event)` не змінена; покращено лише розпізнавання Tab.

Більш надійний focus-trap у модалці незбережених змін на старих браузерних/embedded рушіях.
Менший ризик, що Tab-навігація в модалці не спрацює через нестандартний keyboard event.

Diagnostics:

- `admin.js`: no errors
- `admin.html`: no errors

Grep confirmation:

- `function isSettingsUnsavedTabKey(event)` присутня
- `event.which === 9` присутній у Tab helper
- helper використовується в `handleSettingsUnsavedModalKeyboard(event)`

Smoke API:

- `settingsOk=True; okPage=1; okTotal=5; okItems=1`
