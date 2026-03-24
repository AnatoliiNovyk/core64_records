# Changelog #197: Guard keydown events by currentTarget connectivity

`shouldIgnoreSettingsUnsavedKeydownEvent()` вже відкидав події з `defaultPrevented`, IME/process key, modifier keys та відʼєднаним `event.target`.
Окремої перевірки для відʼєднаного `event.currentTarget` не було.

Додано guard:

- `if (event.currentTarget && event.currentTarget.isConnected === false) return true;`

Іншу логіку helper-функції не змінено.

Менше ризику обробки keydown подій зі stale currentTarget у міжподійних DOM race-сценаріях.
Стабільніший shared keyboard flow для modal/toast.

Diagnostics:

- `admin.js`: no errors
- `admin.html`: no errors

Grep confirmation:

- у `shouldIgnoreSettingsUnsavedKeydownEvent()` присутній `event.currentTarget.isConnected === false` guard

Smoke API:

- `settingsOk=True; okPage=1; okTotal=5; okItems=1`
