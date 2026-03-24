# 2026-03-18 #131 — Settings Unsaved Toast Escape Code Fallback

Визначення Escape у toast keyboard-dismiss спиралось лише на `event.key` (`Escape` / `Esc`).

У `isSettingsUnsavedToastEscapeKey(event)` додано fallback через `event.code === "Escape"`.

Підвищено сумісність обробки Escape у середовищах, де `key` може повертати нестандартні значення, але `code` лишається стабільним.

`get_errors` для `admin.js` і `admin.html`: помилок не виявлено.
grep-перевірка: підтверджено `code === "Escape"` у `isSettingsUnsavedToastEscapeKey`.
Smoke API: `settingsOk=True; okPage=1; okTotal=5; okItems=1`.
