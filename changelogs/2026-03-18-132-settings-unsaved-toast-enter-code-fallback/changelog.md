# 2026-03-18 #132 — Settings Unsaved Toast Enter Code Fallback

Визначення Enter у toast keyboard-dismiss опиралось лише на `event.key` (`Enter` / `Return`).

У `isSettingsUnsavedToastEnterKey(event)` додано fallback через `event.code === "Enter"` і `event.code === "NumpadEnter"`.

Краща сумісність з різними клавіатурними джерелами та numpad-клавішею Enter.
Більш надійна обробка dismiss без залежності тільки від `event.key`.

`get_errors` для `admin.js` і `admin.html`: помилок не виявлено.
grep-перевірка: підтверджено `code === "Enter"` та `code === "NumpadEnter"`.
Smoke API: `settingsOk=True; okPage=1; okTotal=5; okItems=1`.
