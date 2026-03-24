# Changelog #195: Guard backdrop handler by currentTarget id

`handleSettingsUnsavedBackdropClick()` вже перевіряв open-state, preventDefault, connectivity guards, primary click, direct-target click і `event.target.id`.
Водночас явної перевірки `event.currentTarget.id` не було.

Додано guard:

- `if (event.currentTarget && event.currentTarget.id !== "settings-unsaved-modal") return;`

Іншу логіку backdrop dismiss flow не змінено.

Менше ризику випадкової обробки, якщо handler буде викликаний з неочікуваним `currentTarget`.
Надійніший контракт обробника без зміни UX-поведінки.

Diagnostics:

- `admin.js`: no errors
- `admin.html`: no errors

Grep confirmation:

- у `handleSettingsUnsavedBackdropClick()` присутній `currentTarget.id !== "settings-unsaved-modal"` guard

Smoke API:

- `settingsOk=True; okPage=1; okTotal=5; okItems=1`
