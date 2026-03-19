# Changelog #173: isConnected guard for modal focus restoration

## Було
- У `resolveSettingsUnsavedNavigation(action)` відновлення фокусу виконувалось через `requestAnimationFrame(() => previous.focus())` без перевірки, чи елемент ще в DOM.
- У рідкісних сценаріях елемент міг бути відʼєднаний до моменту restore-focus.

## Зміна
- Розширено блок відновлення фокусу:
  - додано перевірку `if (!previous || !previous.isConnected) return;` перед `previous.focus()`.
- Логіка закриття модалки та резолву дії без змін.

## Стало краще
- Менше ризику спроби фокусувати видалений елемент.
- Стабільніше restore-focus поводження після закриття модалки в edge/race сценаріях.

## Валідація
- Diagnostics:
  - `admin.js`: no errors
  - `admin.html`: no errors
- Grep confirmation:
  - `function resolveSettingsUnsavedNavigation(action)` присутня
  - присутній `previous.isConnected` guard перед `previous.focus()`
- Smoke API:
  - `settingsOk=True; okPage=1; okTotal=5; okItems=1`
