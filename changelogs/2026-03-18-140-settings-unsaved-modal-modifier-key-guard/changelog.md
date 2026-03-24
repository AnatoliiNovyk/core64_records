# 2026-03-18 #140 — Settings Unsaved Modal Modifier Key Guard

`handleSettingsUnsavedModalKeyboard(event)` міг реагувати на keydown при натиснутих модифікаторах (`Ctrl`/`Alt`/`Meta`).

Додано ранній вихід у `handleSettingsUnsavedModalKeyboard(event)`: `if (event.ctrlKey || event.altKey || event.metaKey) return;`.

Знижено ризик конфлікту із системними/браузерними шорткатами під час відкритої модалки.
Поведінка keyboard-trap стала безпечнішою та передбачуванішою для комбінацій клавіш.

`get_errors` для `admin.js` і `admin.html`: помилок не виявлено.
grep-перевірка: підтверджено модифікаторний guard у `handleSettingsUnsavedModalKeyboard`.
Smoke API: `settingsOk=True; okPage=1; okTotal=5; okItems=1`.
