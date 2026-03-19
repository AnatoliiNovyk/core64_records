# Changelog #164: Process code fallback in shared IME keydown guard

## Було
- Shared guard `shouldIgnoreSettingsUnsavedKeydownEvent(event)` враховував IME-події через `event.isComposing`, `event.key === "Process"`, `event.keyCode === 229`, `event.which === 229`.
- У частині реалізацій `Process` може приходити саме в `event.code`.

## Зміна
- Додано fallback у shared guard:
  - `event.code === "Process"`
- Логіка dismiss/modal flow не змінювалась.

## Стало краще
- Надійніше відсіювання IME keydown-подій у кросбраузерних сценаріях.
- Менше шансів хибного dismiss trigger, якщо браузер віддає `Process` через `code`.

## Валідація
- Diagnostics:
  - `admin.js`: no errors
  - `admin.html`: no errors
- Grep confirmation:
  - `function shouldIgnoreSettingsUnsavedKeydownEvent(event)` присутня
  - умова містить `event.code === "Process"`
- Smoke API:
  - `settingsOk=True; okPage=1; okTotal=5; okItems=1`
