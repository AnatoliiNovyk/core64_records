# Changelog #191: Guard toast queue processing by element connectivity

`processSettingsUnsavedToastQueue()` перевіряв наявність `toastEl` і `settingsUnsavedToastActive`.
У рідкісному edge-сценарії при DOM churn елемент toast міг бути відʼєднаним.

Додано додатковий guard на початку `processSettingsUnsavedToastQueue()`:

- `if (!toastEl.isConnected) return;`

Бізнес-логіка черги не змінена.

Менше ризику запуску queue/render-flow на stale елементі toast.
Надійніший lifecycle toast у нестабільних браузерних станах.

Diagnostics:

- `admin.js`: no errors
- `admin.html`: no errors

Grep confirmation:

- у `processSettingsUnsavedToastQueue()` присутній `toastEl.isConnected` guard

Smoke API:

- `settingsOk=True; okPage=1; okTotal=5; okItems=1`
