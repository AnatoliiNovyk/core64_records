# Changelog #192: Guard keydown events by target connectivity

`shouldIgnoreSettingsUnsavedKeydownEvent()` перевіряв `defaultPrevented`, IME/process key та modifier keys.
У рідкісних race-сценаріях подія могла приходити зі stale `event.target`, відʼєднаним від DOM.

Додано додатковий guard:

- `if (event.target && event.target.isConnected === false) return true;`

Іншу логіку helper-функції не змінено.

Менше ризику обробки keydown для відʼєднаних елементів.
Надійніший shared keyboard flow для modal/toast обробників.

Diagnostics:

- `admin.js`: no errors
- `admin.html`: no errors

Grep confirmation:

- у `shouldIgnoreSettingsUnsavedKeydownEvent()` присутній guard `event.target.isConnected === false`

Smoke API:

- `settingsOk=True; okPage=1; okTotal=5; okItems=1`
