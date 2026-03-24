# Changelog - 2026-03-18 - Settings unsaved toast pause on hover/focus

`settings-unsaved` toast закривався тільки за фіксованим таймером.
Якщо користувач наводив курсор або переходив у фокус на toast, таймер не зупинявся.

Файл: `admin.js`

- Додано таймінг-стани:
- `settingsUnsavedToastDeadlineMs`
- `settingsUnsavedToastRemainingMs`
- Додано константи:
- `SETTINGS_UNSAVED_TOAST_DURATION_MS`
- `SETTINGS_UNSAVED_TOAST_MIN_REMAINING_MS`
- Додано керування автозакриттям:
- `scheduleSettingsUnsavedToastAutoClose(delayMs)`
- `pauseSettingsUnsavedToastAutoClose()`
- `resumeSettingsUnsavedToastAutoClose()`
- `processSettingsUnsavedToastQueue()` переведено на новий scheduler.
- `finalizeSettingsUnsavedToastDisplay()` очищає таймінг-стани при завершенні показу.

Файл: `admin.html`

- Для `#settings-unsaved-toast` додано події:
- `onmouseenter` / `onmouseleave`
- `onfocusin` / `onfocusout`
- Події прив’язані до pause/resume автозакриття.

Toast не зникає, поки користувач його читає під курсором або у фокусі.
Після завершення взаємодії автозакриття відновлюється з залишком часу, а не стартує заново щоразу.
Працює сумісно з попередніми покращеннями: ручне закриття, дедуплікація, пріоритет warn, queue-limit, індикатор `+N`.

Статичні перевірки:

- `admin.js`: без помилок
- `admin.html`: без помилок

Smoke API:

- `settingsOk=True; okPage=1; okTotal=5; okItems=1`
