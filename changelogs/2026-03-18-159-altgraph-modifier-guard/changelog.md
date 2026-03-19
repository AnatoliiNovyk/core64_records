# Changelog #159: AltGraph modifier support in shared keydown guard

## Було
- Helper `hasSettingsUnsavedModifierKeys(event)` враховував `ctrlKey`, `altKey`, `metaKey`.
- На частині міжнародних клавіатур AltGr-комбінації можуть поводитись окремо, і це могло пропускатись як немодифікований keydown.

## Зміна
- Розширено `hasSettingsUnsavedModifierKeys(event)`:
  - додано перевірку `event.getModifierState("AltGraph")` (за наявності API)
- Загальна логіка dismiss/modal flow не змінювалась; посилено лише shared modifier guard.

## Стало краще
- Кращий захист від небажаних dismiss-trigger під час AltGr-комбінацій на міжнародних розкладках.
- Більш коректна поведінка shared keydown ignore-шляху для нестандартних keyboard схем.

## Валідація
- Diagnostics:
  - `admin.js`: no errors
  - `admin.html`: no errors
- Grep confirmation:
  - `function hasSettingsUnsavedModifierKeys(event)` присутня
  - `getModifierState("AltGraph")` присутній у modifier helper
  - helper використовується в `shouldIgnoreSettingsUnsavedKeydownEvent(event)`
- Smoke API:
  - `settingsOk=True; okPage=1; okTotal=5; okItems=1`
