# 2026-03-18 #136 — Settings Unsaved Modal IME Guard

`handleSettingsUnsavedModalKeyboard(event)` міг обробляти keydown під час IME-композиції.

Додано ранній вихід: `if (event.isComposing) return;` у `handleSettingsUnsavedModalKeyboard(event)`.

Зменшено ризик хибної обробки Escape/Tab під час введення через IME.
Keyboard-поведінка модалки стала стабільнішою для багатомовного вводу.

`get_errors` для `admin.js` і `admin.html`: помилок не виявлено.
grep-перевірка: підтверджено `event.isComposing` guard у `handleSettingsUnsavedModalKeyboard`.
Smoke API: `settingsOk=True; okPage=1; okTotal=5; okItems=1`.
