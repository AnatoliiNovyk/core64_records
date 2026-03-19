# 2026-03-18 #128 — Settings Unsaved Toast Escape Key Normalization

## Було
- У keyboard-dismiss логіці тоста перевірявся лише `event.key === "Escape"`.
- Legacy-варіант `Esc` не враховувався.

## Зміна
- Додано спільний хелпер `isSettingsUnsavedToastEscapeKey(event)` у `admin.js`.
- `dismissSettingsUnsavedToast(event)` переведено на `isEscape`-перевірку.
- `handleSettingsUnsavedToastCloseButtonKeydown(event)` також переведено на `isEscape`.

## Стало краще
- Підвищено кросбраузерну сумісність для клавіші Escape у сценаріях dismiss.
- Логіка в обох обробниках уніфікована, легше підтримувати далі.

## Валідація
- `get_errors` для `admin.js` і `admin.html`: помилок не виявлено.
- grep-перевірка: підтверджено `isSettingsUnsavedToastEscapeKey` і гілку `key === "Esc"`.
- Smoke API: `settingsOk=True; okPage=1; okTotal=5; okItems=1`.
