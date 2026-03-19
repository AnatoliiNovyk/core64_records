# 2026-03-18 #148 — Settings Unsaved Modal Unused Key Cleanup

## Було
- У `handleSettingsUnsavedModalKeyboard(event)` лишалась локальна змінна `const key = event.key;`, яка більше не використовувалась після переходу на helper-функції.

## Зміна
- Видалено невикористану змінну `key` з `handleSettingsUnsavedModalKeyboard(event)`.

## Стало краще
- Код став чистішим і простішим для читання.
- Без функціональних змін, лише технічне прибирання.

## Валідація
- `get_errors` для `admin.js` і `admin.html`: помилок не виявлено.
- grep-перевірка: у `handleSettingsUnsavedModalKeyboard` більше немає `const key = event.key`.
- Smoke API: `settingsOk=True; okPage=1; okTotal=5; okItems=1`.
