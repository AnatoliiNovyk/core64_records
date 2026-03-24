# 2026-03-18 #141 — Settings Unsaved Modifier Helper Refactor

Перевірка модифікаторів клавіш (`Ctrl`/`Alt`/`Meta`) дублювалась у `dismissSettingsUnsavedToast(event)` та `handleSettingsUnsavedModalKeyboard(event)`.

Додано спільний хелпер `hasSettingsUnsavedModifierKeys(event)` у `admin.js`.
Обидва обробники переведено на використання цього хелпера.

Менше дублювання keyboard-логіки й простіша подальша підтримка.
Поведінка не змінена, але стала консистентною через одну точку перевірки.

`get_errors` для `admin.js` і `admin.html`: помилок не виявлено.
grep-перевірка: підтверджено `hasSettingsUnsavedModifierKeys(event)` у двох обробниках.
Smoke API: `settingsOk=True; okPage=1; okTotal=5; okItems=1`.
