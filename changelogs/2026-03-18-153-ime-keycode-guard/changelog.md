# Changelog #153: IME keyCode guard fallback for settings-unsaved keydown

Shared guard `shouldIgnoreSettingsUnsavedKeydownEvent(event)` ігнорував IME-події через `event.isComposing` та `event.key === "Process"`.
У частині legacy/нестандартних реалізацій IME-подій може приходити лише `keyCode=229` без стабільного `key`.

Розширено IME-guard у `shouldIgnoreSettingsUnsavedKeydownEvent(event)`:

- було: `event.key === "Process"`
- стало: `event.key === "Process" || event.keyCode === 229`

Інша логіка dismiss і key helpers лишилась без змін.

Надійніше блокування небажаних dismiss-trigger під час IME/композиції вводу в legacy-сценаріях.
Менше ризику випадкового закриття `settings-unsaved` toast під час введення через IME.

Diagnostics:

- `admin.js`: no errors
- `admin.html`: no errors

Grep confirmation:

- `function shouldIgnoreSettingsUnsavedKeydownEvent(event)` присутня
- умова `event.keyCode === 229` присутня разом з `event.key === "Process"`

Smoke API:

- `settingsOk=True; okPage=1; okTotal=5; okItems=1`
