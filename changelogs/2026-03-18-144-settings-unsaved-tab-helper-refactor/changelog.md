# 2026-03-18 #144 — Settings Unsaved Tab Helper Refactor

Перевірка Tab у `handleSettingsUnsavedModalKeyboard(event)` була локальною інлайн-умовою (`key`/`code`).

Додано helper `isSettingsUnsavedTabKey(event)` у `admin.js`.
Modal keyboard-handler переведено на `const isTab = isSettingsUnsavedTabKey(event)`.

Зменшено дублювання keyboard-умов, логіка стала більш модульною.
Поведінка без змін, але простіше підтримувати й повторно використовувати Tab-детекцію.

`get_errors` для `admin.js` і `admin.html`: помилок не виявлено.
grep-перевірка: підтверджено helper `isSettingsUnsavedTabKey(event)` та його використання в modal handler.
Smoke API: `settingsOk=True; okPage=1; okTotal=5; okItems=1`.
