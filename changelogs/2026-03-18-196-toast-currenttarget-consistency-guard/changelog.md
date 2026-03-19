# Changelog #196: Add currentTarget consistency guard for toast return-focus capture

## Було
- `updateSettingsUnsavedToastReturnFocus()` перевіряв candidate, приналежність до toast, connectivity та наявність `focus()`.
- Водночас не було явної перевірки, що подія походить саме від поточного toast контейнера.

## Зміна
- Додано source-consistency guard:
  - `if (event && event.currentTarget && event.currentTarget !== toastEl) return;`
- Іншу логіку helper-функції не змінено.

## Стало краще
- Менше ризику приймати side-event з неочікуваного currentTarget у edge сценаріях.
- Стабільніший capture return-focus без зміни UX-поведінки.

## Валідація
- Diagnostics:
  - `admin.js`: no errors
  - `admin.html`: no errors
- Grep confirmation:
  - у `updateSettingsUnsavedToastReturnFocus()` присутній `currentTarget !== toastEl` guard
- Smoke API:
  - `settingsOk=True; okPage=1; okTotal=5; okItems=1`
