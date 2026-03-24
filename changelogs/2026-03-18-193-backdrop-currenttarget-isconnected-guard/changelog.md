# Changelog #193: Guard backdrop handler by currentTarget connectivity

`handleSettingsUnsavedBackdropClick()` перевіряв open-state модалки, `defaultPrevented`, кнопку миші, direct-click та id таргета.
У рідкісних race-сценаріях `event.currentTarget` міг бути вже відʼєднаним від DOM.

Додано додатковий guard:

- `if (event.currentTarget && event.currentTarget.isConnected === false) return;`

Іншу логіку backdrop-скасування не змінено.

Менше ризику виконання dismiss-flow на stale currentTarget.
Надійніша поведінка backdrop-кліку в edge DOM churn станах.

Diagnostics:

- `admin.js`: no errors
- `admin.html`: no errors

Grep confirmation:

- у `handleSettingsUnsavedBackdropClick()` присутній `currentTarget.isConnected === false` guard

Smoke API:

- `settingsOk=True; okPage=1; okTotal=5; okItems=1`
