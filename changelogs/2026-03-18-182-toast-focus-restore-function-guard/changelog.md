# Changelog #182: Add focus-function guard in toast focus-restore callback

## Було
- У `finalizeSettingsUnsavedToastDisplay()` відновлення фокусу вже мало `isConnected` перевірку та `try/catch`.
- Але між плануванням RAF і виконанням callback таргет міг змінитися.

## Зміна
- У RAF callback додано додатковий guard:
  - `if (typeof restoreTarget.focus !== "function") return;`
- Інша логіка (`shouldRestoreFocus`, `isConnected`, `try/catch`) залишена без змін.

## Стало краще
- Менше ризику edge-випадку з мутацією таргета між кадрами.
- Підвищена стабільність закриття toast без зміни UX-контракту.

## Валідація
- Diagnostics:
  - `admin.js`: no errors
  - `admin.html`: no errors
- Grep confirmation:
  - у toast focus-restore callback присутній `typeof restoreTarget.focus !== "function"`
- Smoke API:
  - `settingsOk=True; okPage=1; okTotal=5; okItems=1`
