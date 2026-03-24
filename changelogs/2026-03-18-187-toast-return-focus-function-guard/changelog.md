# Changelog #187: Add focus-function guard for toast return-focus candidate

У `updateSettingsUnsavedToastReturnFocus()` кандидат із `event.relatedTarget` уже перевірявся на належність toast та `isConnected`.
Але не було прямої перевірки, що кандидат підтримує `focus()`.

Додано runtime-guard перед збереженням кандидата:

- `if (typeof candidate.focus !== "function") return;`

Решта логіки залишилась без змін.

Менше ризику зберегти нефокусований/нестандартний таргет для restore-flow.
Стабільніша робота focus-повернення в edge DOM-сценаріях.

Diagnostics:

- `admin.js`: no errors
- `admin.html`: no errors

Grep confirmation:

- у `updateSettingsUnsavedToastReturnFocus()` присутній `typeof candidate.focus !== "function"`

Smoke API:

- `settingsOk=True; okPage=1; okTotal=5; okItems=1`
