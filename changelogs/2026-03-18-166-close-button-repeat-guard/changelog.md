# Changelog #166: Repeat keydown guard for toast close button handler

## Було
- Обробник `handleSettingsUnsavedToastCloseButtonKeydown(event)` не мав окремого early-return для `event.repeat`.
- При утриманні клавіші (Enter/Space/Escape) обробник міг повторно проходити логіку на автоповторі keydown.

## Зміна
- Додано early-return у `handleSettingsUnsavedToastCloseButtonKeydown(event)`:
  - `if (event.repeat) return;`
- Основна dismiss-логіка без змін.

## Стало краще
- Менше зайвих повторних keydown-trigger під час утримання клавіші на кнопці закриття toast.
- Більш стабільна і передбачувана обробка клавіатури без шуму від автоповтору.

## Валідація
- Diagnostics:
  - `admin.js`: no errors
  - `admin.html`: no errors
- Grep confirmation:
  - `function handleSettingsUnsavedToastCloseButtonKeydown(event)` присутня
  - `if (event.repeat) return;` присутній у close-button handler
- Smoke API:
  - `settingsOk=True; okPage=1; okTotal=5; okItems=1`
