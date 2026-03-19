# 2026-03-18 #135 — Settings Unsaved Modal defaultPrevented Guard

## Було
- `handleSettingsUnsavedModalKeyboard(event)` обробляв keydown навіть якщо подія вже була позначена як `defaultPrevented` іншим обробником.

## Зміна
- Додано ранній вихід: `if (event.defaultPrevented) return;` у `handleSettingsUnsavedModalKeyboard(event)`.

## Стало краще
- Зменшено ризик дубльованої/конфліктної обробки клавіатурних подій у модалці.
- Поведінка keyboard-trap стала передбачуванішою при наявності суміжних keydown-слухачів.

## Валідація
- `get_errors` для `admin.js` і `admin.html`: помилок не виявлено.
- grep-перевірка: підтверджено `event.defaultPrevented` guard у `handleSettingsUnsavedModalKeyboard`.
- Smoke API: `settingsOk=True; okPage=1; okTotal=5; okItems=1`.
