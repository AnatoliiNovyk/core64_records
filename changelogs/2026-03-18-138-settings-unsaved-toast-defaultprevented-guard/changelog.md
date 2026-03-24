# 2026-03-18 #138 — Settings Unsaved Toast defaultPrevented Guard

`dismissSettingsUnsavedToast(event)` обробляв keydown навіть якщо подія вже мала `defaultPrevented`.

У keydown-гілку `dismissSettingsUnsavedToast(event)` додано ранній вихід: `if (event.defaultPrevented) return;`.

Зменшено ризик дубльованої/конфліктної обробки клавіатурного dismiss у toast.
Поведінка стала узгодженою з modal keyboard-handler, де аналогічний guard уже є.

`get_errors` для `admin.js` і `admin.html`: помилок не виявлено.
grep-перевірка: підтверджено `event.defaultPrevented` у `dismissSettingsUnsavedToast(event)`.
Smoke API: `settingsOk=True; okPage=1; okTotal=5; okItems=1`.
