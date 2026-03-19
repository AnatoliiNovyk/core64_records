# 2026-03-18 #146 — Settings Unsaved Toast Dismiss Key Helper

## Було
- Перевірка dismiss-клавіш (Enter/Space/Escape) частково дублювалась між `dismissSettingsUnsavedToast(event)` і `handleSettingsUnsavedToastCloseButtonKeydown(event)`.

## Зміна
- Додано helper `isSettingsUnsavedToastDismissKey(event)` у `admin.js`.
- Обидва toast keyboard-обробники переведено на використання цього helper.

## Стало краще
- Менше дублювання keyboard-логіки dismiss.
- Поведінка не змінена, але код став простішим для підтримки й наступних інкрементів.

## Валідація
- `get_errors` для `admin.js` і `admin.html`: помилок не виявлено.
- grep-перевірка: підтверджено `isSettingsUnsavedToastDismissKey(event)` і його використання в обох обробниках.
- Smoke API: `settingsOk=True; okPage=1; okTotal=5; okItems=1`.
