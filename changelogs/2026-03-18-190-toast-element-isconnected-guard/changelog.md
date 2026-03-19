# Changelog #190: Guard toast element connectivity in return-focus capture

## Було
- `updateSettingsUnsavedToastReturnFocus()` перевіряв candidate, належність candidate до toast, а також `candidate.isConnected`.
- Але сам `toastEl` не перевірявся на `isConnected` перед подальшими діями.

## Зміна
- Додано додатковий guard:
  - `if (!toastEl.isConnected) return;`
- Іншу логіку helper-функції не змінено.

## Стало краще
- Менше ризику виконання helper-логіки над stale toast-елементом у міжкадрових DOM churn сценаріях.
- Надійніший capture return-focus потік без зміни UX-поведінки.

## Валідація
- Diagnostics:
  - `admin.js`: no errors
  - `admin.html`: no errors
- Grep confirmation:
  - у `updateSettingsUnsavedToastReturnFocus()` присутній `toastEl.isConnected` guard
- Smoke API:
  - `settingsOk=True; okPage=1; okTotal=5; okItems=1`
