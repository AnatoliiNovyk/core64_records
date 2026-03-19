# Changelog #184: Add focus-function guard for modal primary autofocus

## Було
- У `showSettingsUnsavedNavigationModal()` autofocus primary-кнопки вже мав open-state, `isConnected`, containment checks та `try/catch`.
- Але не було прямого runtime-guard, що `primaryBtn.focus` все ще є функцією в момент виклику.

## Зміна
- У RAF callback додано перевірку:
  - `if (typeof primaryBtn.focus !== "function") return;`
- Іншу логіку autofocus не змінено.

## Стало краще
- Додаткова стійкість до рідкісних міжкадрових мутацій обʼєкта таргета.
- Менший ризик edge-винятків без змін UX-поведінки.

## Валідація
- Diagnostics:
  - `admin.js`: no errors
  - `admin.html`: no errors
- Grep confirmation:
  - у autofocus callback присутній `typeof primaryBtn.focus !== "function"`
- Smoke API:
  - `settingsOk=True; okPage=1; okTotal=5; okItems=1`
