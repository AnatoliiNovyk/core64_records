# 2026-03-18 #129 — Settings Unsaved Modal Esc Compatibility

## Було
- Закриття модального вікна незбережених змін з клавіатури спиралось лише на `event.key === "Escape"`.
- Legacy-варіант `Esc` не оброблявся.

## Зміна
- У `handleSettingsUnsavedModalKeyboard(event)` додано підтримку `event.key === "Esc"` поряд із `Escape`.

## Стало краще
- Підвищено кросбраузерну сумісність клавіатурного закриття модалки.
- Поведінка cancel-дії стала більш стабільною на старіших/нестандартних key-map джерелах.

## Валідація
- `get_errors` для `admin.js` і `admin.html`: помилок не виявлено.
- grep-перевірка: підтверджено умову `event.key === "Escape" || event.key === "Esc"` у `handleSettingsUnsavedModalKeyboard`.
- Smoke API: `settingsOk=True; okPage=1; okTotal=5; okItems=1`.
