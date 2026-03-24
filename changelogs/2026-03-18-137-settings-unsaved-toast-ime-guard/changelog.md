# 2026-03-18 #137 — Settings Unsaved Toast IME Guard

`dismissSettingsUnsavedToast(event)` міг обробляти keydown під час IME-композиції.

У keydown-гілку `dismissSettingsUnsavedToast(event)` додано ранній вихід: `if (event.isComposing) return;`.

Зменшено ризик випадкового закриття toast під час введення через IME.
Keyboard-dismiss став узгодженішим із захистом, який уже є в modal keyboard-handler.

`get_errors` для `admin.js` і `admin.html`: помилок не виявлено.
grep-перевірка: підтверджено `event.isComposing` у `dismissSettingsUnsavedToast(event)`.
Smoke API: `settingsOk=True; okPage=1; okTotal=5; okItems=1`.
