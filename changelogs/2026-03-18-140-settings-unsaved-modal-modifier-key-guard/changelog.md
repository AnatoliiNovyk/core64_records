# 2026-03-18 #140 — Settings Unsaved Modal Modifier Key Guard

## Було
- `handleSettingsUnsavedModalKeyboard(event)` міг реагувати на keydown при натиснутих модифікаторах (`Ctrl`/`Alt`/`Meta`).

## Зміна
- Додано ранній вихід у `handleSettingsUnsavedModalKeyboard(event)`: `if (event.ctrlKey || event.altKey || event.metaKey) return;`.

## Стало краще
- Знижено ризик конфлікту із системними/браузерними шорткатами під час відкритої модалки.
- Поведінка keyboard-trap стала безпечнішою та передбачуванішою для комбінацій клавіш.

## Валідація
- `get_errors` для `admin.js` і `admin.html`: помилок не виявлено.
- grep-перевірка: підтверджено модифікаторний guard у `handleSettingsUnsavedModalKeyboard`.
- Smoke API: `settingsOk=True; okPage=1; okTotal=5; okItems=1`.
