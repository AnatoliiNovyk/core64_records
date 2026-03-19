# Changelog #170: Repeat guard for Tab branch in unsaved modal keyboard handler

## Було
- `handleSettingsUnsavedModalKeyboard(event)` не мав окремого early-return для `event.repeat` у Tab-гілці.
- При утриманні Tab автоповтор keydown міг часто повторювати focus-trap цикл.

## Зміна
- Після визначення `isTab` у modal handler додано:
  - `if (event.repeat) return;`
- Решта логіки focus-trap та Escape-гілки без змін.

## Стало краще
- Менше зайвих повторних focus-switch при утриманні Tab.
- Стабільніша і більш передбачувана робота keyboard trap у модалці.

## Валідація
- Diagnostics:
  - `admin.js`: no errors
  - `admin.html`: no errors
- Grep confirmation:
  - `function handleSettingsUnsavedModalKeyboard(event)` присутня
  - у Tab-гілці присутній `if (event.repeat) return;`
- Smoke API:
  - `settingsOk=True; okPage=1; okTotal=5; okItems=1`
