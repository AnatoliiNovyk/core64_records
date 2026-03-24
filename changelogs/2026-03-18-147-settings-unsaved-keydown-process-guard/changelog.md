# 2026-03-18 #147 — Settings Unsaved Keydown Process Guard

Shared keydown-guard (`shouldIgnoreSettingsUnsavedKeydownEvent`) не враховував `event.key === "Process"`, який часто з'являється в IME/системних сценаріях.

Додано умову `if (event.key === "Process") return true;` у `shouldIgnoreSettingsUnsavedKeydownEvent(event)`.

Знижено ризик хибної обробки keydown під час IME/службових подій.
Toast і modal keyboard-шляхи автоматично отримали покращення через shared helper.

`get_errors` для `admin.js` і `admin.html`: помилок не виявлено.
grep-перевірка: підтверджено `key === "Process"` у `shouldIgnoreSettingsUnsavedKeydownEvent`.
Smoke API: `settingsOk=True; okPage=1; okTotal=5; okItems=1`.
