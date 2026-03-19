# 2026-03-18 #149 — Settings Unsaved Tab keyCode Fallback

## Було
- `isSettingsUnsavedTabKey(event)` визначав Tab лише через `event.key` та `event.code`.

## Зміна
- Додано legacy fallback: `event.keyCode === 9` у `isSettingsUnsavedTabKey(event)`.

## Стало краще
- Підвищено сумісність keyboard-trap модалки для старіших/нестандартних середовищ подій.
- Поведінка в сучасних браузерах не змінюється.

## Валідація
- `get_errors` для `admin.js` і `admin.html`: помилок не виявлено.
- grep-перевірка: підтверджено `keyCode === 9` у `isSettingsUnsavedTabKey`.
- Smoke API: `settingsOk=True; okPage=1; okTotal=5; okItems=1`.
