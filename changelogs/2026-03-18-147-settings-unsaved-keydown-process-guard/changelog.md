# 2026-03-18 #147 — Settings Unsaved Keydown Process Guard

## Було
- Shared keydown-guard (`shouldIgnoreSettingsUnsavedKeydownEvent`) не враховував `event.key === "Process"`, який часто з'являється в IME/системних сценаріях.

## Зміна
- Додано умову `if (event.key === "Process") return true;` у `shouldIgnoreSettingsUnsavedKeydownEvent(event)`.

## Стало краще
- Знижено ризик хибної обробки keydown під час IME/службових подій.
- Toast і modal keyboard-шляхи автоматично отримали покращення через shared helper.

## Валідація
- `get_errors` для `admin.js` і `admin.html`: помилок не виявлено.
- grep-перевірка: підтверджено `key === "Process"` у `shouldIgnoreSettingsUnsavedKeydownEvent`.
- Smoke API: `settingsOk=True; okPage=1; okTotal=5; okItems=1`.
