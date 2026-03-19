# 2026-03-18 #134 — Settings Unsaved Modal Tab Code Fallback

## Було
- У keyboard-trap модалки фільтрація Tab спиралась лише на `event.key === "Tab"`.

## Зміна
- У `handleSettingsUnsavedModalKeyboard(event)` додано fallback через `event.code === "Tab"`.
- Введено локальну перевірку `isTab` для уніфікованої умови.

## Стало краще
- Підвищено надійність циклу фокуса в модалці на різних браузерах/девайсах.
- Менше ризику пропуску Tab-події при варіативних значеннях `key`.

## Валідація
- `get_errors` для `admin.js` і `admin.html`: помилок не виявлено.
- grep-перевірка: підтверджено `const isTab = key === "Tab" || code === "Tab"`.
- Smoke API: `settingsOk=True; okPage=1; okTotal=5; okItems=1`.
