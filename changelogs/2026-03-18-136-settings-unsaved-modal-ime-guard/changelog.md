# 2026-03-18 #136 — Settings Unsaved Modal IME Guard

## Було
- `handleSettingsUnsavedModalKeyboard(event)` міг обробляти keydown під час IME-композиції.

## Зміна
- Додано ранній вихід: `if (event.isComposing) return;` у `handleSettingsUnsavedModalKeyboard(event)`.

## Стало краще
- Зменшено ризик хибної обробки Escape/Tab під час введення через IME.
- Keyboard-поведінка модалки стала стабільнішою для багатомовного вводу.

## Валідація
- `get_errors` для `admin.js` і `admin.html`: помилок не виявлено.
- grep-перевірка: підтверджено `event.isComposing` guard у `handleSettingsUnsavedModalKeyboard`.
- Smoke API: `settingsOk=True; okPage=1; okTotal=5; okItems=1`.
