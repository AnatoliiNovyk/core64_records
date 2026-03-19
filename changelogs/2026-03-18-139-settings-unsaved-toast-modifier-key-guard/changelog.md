# 2026-03-18 #139 — Settings Unsaved Toast Modifier Key Guard

## Було
- `dismissSettingsUnsavedToast(event)` міг обробляти keydown навіть для комбінацій із модифікаторами (`Ctrl`/`Alt`/`Meta`).

## Зміна
- У keydown-гілку `dismissSettingsUnsavedToast(event)` додано ранній вихід: `if (event.ctrlKey || event.altKey || event.metaKey) return;`.

## Стало краще
- Знижено ризик випадкового закриття toast під час використання клавіатурних шорткатів.
- Keyboard-dismiss став передбачуванішим і обмеженим лише на «чисті» Enter/Space/Escape натискання.

## Валідація
- `get_errors` для `admin.js` і `admin.html`: помилок не виявлено.
- grep-перевірка: підтверджено модифікаторний guard у `dismissSettingsUnsavedToast(event)`.
- Smoke API: `settingsOk=True; okPage=1; okTotal=5; okItems=1`.
