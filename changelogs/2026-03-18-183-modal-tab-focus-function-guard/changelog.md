# Changelog #183: Add focus-function guards in modal Tab loop

## Було
- У `handleSettingsUnsavedModalKeyboard()` Tab-циклювання вже перевіряло `isConnected` і мало `try/catch` навколо focus.
- Але не було прямої перевірки, що `focus` залишається функцією в момент виклику.

## Зміна
- Додано runtime-guard у двох точках Tab-циклювання:
  - `if (typeof last.focus !== "function") return;`
  - `if (typeof first.focus !== "function") return;`
- Бізнес-поведінка не змінена.

## Стало краще
- Додаткова стійкість до рідкісних міжподійних мутацій DOM-елементів.
- Менше ризику edge-винятків у keyboard focus-trap.

## Валідація
- Diagnostics:
  - `admin.js`: no errors
  - `admin.html`: no errors
- Grep confirmation:
  - у Tab-циклі присутні `typeof last.focus !== "function"` і `typeof first.focus !== "function"`
- Smoke API:
  - `settingsOk=True; okPage=1; okTotal=5; okItems=1`
