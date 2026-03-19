# Changelog #178: Guard modal primary autofocus by open state and containment

## Було
- У `showSettingsUnsavedNavigationModal()` autofocus primary-кнопки вже мав `isConnected` та `try/catch`.
- Проте callback `requestAnimationFrame` міг спрацювати після швидкого закриття/зміни DOM, коли модалка вже не відкрита.

## Зміна
- В autofocus callback додано додаткові defensive-перевірки:
  - `if (!isSettingsUnsavedModalOpen()) return;`
  - `if (!modalEl.contains(primaryBtn)) return;`
- Поведінка UI не змінена; посилено лише захист від edge-race сценаріїв.

## Стало краще
- Менше ризику focus-операції після закриття модалки.
- Стабільніший autofocus у випадках швидких перемикань стану або реконфігурації DOM.

## Валідація
- Diagnostics:
  - `admin.js`: no errors
  - `admin.html`: no errors
- Grep confirmation:
  - у autofocus callback присутні `isSettingsUnsavedModalOpen()` і `modalEl.contains(primaryBtn)`
- Smoke API:
  - `settingsOk=True; okPage=1; okTotal=5; okItems=1`
