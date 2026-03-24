# Changelog #158: IME which fallback in shared keydown guard

Shared guard `shouldIgnoreSettingsUnsavedKeydownEvent(event)` відсікав IME-події за `event.isComposing`, `event.key === "Process"` і `event.keyCode === 229`.
У частині legacy keyboard-event реалізацій IME-ідентифікація може приходити тільки через `which`.

Додано fallback у shared guard:

- `|| event.which === 229`

Основна поведінка dismiss/modal flow не змінена; розширена лише IME-детекція для ignore-шляху.

Надійніше уникнення небажаних keydown-trigger під час IME/композиції вводу на legacy/embedded рушіях.
Узгодженіше покриття legacy-полів (`keyCode` + `which`) у критичному guard.

Diagnostics:

- `admin.js`: no errors
- `admin.html`: no errors

Grep confirmation:

- `function shouldIgnoreSettingsUnsavedKeydownEvent(event)` присутня
- умова містить `event.keyCode === 229` та `event.which === 229`

Smoke API:

- `settingsOk=True; okPage=1; okTotal=5; okItems=1`
