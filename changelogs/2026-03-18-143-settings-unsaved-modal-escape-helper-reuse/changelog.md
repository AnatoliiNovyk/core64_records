# 2026-03-18 #143 — Settings Unsaved Modal Escape Helper Reuse

У `handleSettingsUnsavedModalKeyboard(event)` перевірка Escape була інлайн-умовою (`key`/`code`), окремо від toast helper-логіки.

Модальний keyboard-handler переведено на спільний helper `isSettingsUnsavedToastEscapeKey(event)`.
Інлайн-перевірку `key/code` прибрано.

Логіка Escape у toast і modal тепер уніфікована в одній точці.
Менше дублювання, простіша підтримка й менший ризик розсинхрону в майбутніх правках.

`get_errors` для `admin.js` і `admin.html`: помилок не виявлено.
grep-перевірка: підтверджено використання `isSettingsUnsavedToastEscapeKey(event)` у `handleSettingsUnsavedModalKeyboard`.
Smoke API: `settingsOk=True; okPage=1; okTotal=5; okItems=1`.
