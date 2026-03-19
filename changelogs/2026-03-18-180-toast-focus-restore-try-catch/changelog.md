# Changelog #180: Guard toast focus-restore with try/catch

## Було
- У `finalizeSettingsUnsavedToastDisplay()` відновлення фокусу після закриття toast виконувалось як прямий виклик `restoreTarget.focus()`.
- У рідкісних браузерних edge-сценаріях це могло кинути виняток, навіть коли елемент ще `isConnected`.

## Зміна
- В RAF callback відновлення фокусу додано `try/catch` навколо `restoreTarget.focus()`.
- Логіку вибору таргета і умови `isConnected` не змінено.

## Стало краще
- Менше ризику runtime-винятку в потоці закриття toast.
- Стабільніша робота focus-restore у нестабільних/перехідних станах UI.

## Валідація
- Diagnostics:
  - `admin.js`: no errors
  - `admin.html`: no errors
- Grep confirmation:
  - у `finalizeSettingsUnsavedToastDisplay()` `restoreTarget.focus()` обгорнуто в `try/catch`
- Smoke API:
  - `settingsOk=True; okPage=1; okTotal=5; okItems=1`
