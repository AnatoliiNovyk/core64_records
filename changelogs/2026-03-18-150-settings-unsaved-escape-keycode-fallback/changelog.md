# 2026-03-18 #150 — Settings Unsaved Escape keyCode Fallback

`isSettingsUnsavedToastEscapeKey(event)` визначав Escape через `event.key` і `event.code` без legacy fallback через `keyCode`.

Додано fallback `event.keyCode === 27` у `isSettingsUnsavedToastEscapeKey(event)`.

Покращено сумісність для старіших/нестандартних джерел keyboard-подій.
Покращення автоматично покриває toast/modal Escape-шляхи через спільний helper.

`get_errors` для `admin.js` і `admin.html`: помилок не виявлено.
grep-перевірка: підтверджено `keyCode === 27` у `isSettingsUnsavedToastEscapeKey`.
Smoke API: `settingsOk=True; okPage=1; okTotal=5; okItems=1`.
