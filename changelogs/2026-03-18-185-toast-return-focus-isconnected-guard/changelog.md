# Changelog #185: Guard toast return-focus candidate by isConnected

У `updateSettingsUnsavedToastReturnFocus()` як кандидат на повернення фокусу зберігався `event.relatedTarget`, якщо він належав toast.
У рідкісних edge-сценаріях цей елемент міг бути вже відʼєднаний від DOM.

Додано додаткову перевірку перед збереженням кандидата:

- `if (!candidate.isConnected) return;`

Іншу логіку визначення кандидата не змінено.

Менше ризику зберегти невалідний таргет для подальшого focus-restore.
Стабільніший toast focus-flow у race-сценаріях.

Diagnostics:

- `admin.js`: no errors
- `admin.html`: no errors

Grep confirmation:

- у `updateSettingsUnsavedToastReturnFocus()` присутній `candidate.isConnected` guard

Smoke API:

- `settingsOk=True; okPage=1; okTotal=5; okItems=1`
