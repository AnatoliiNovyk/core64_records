# 2026-03-18 #133 — Settings Unsaved Modal Escape Code Fallback

## Було
- Закриття модалки незбережених змін з клавіатури спиралось на `event.key` (`Escape` / `Esc`).

## Зміна
- У `handleSettingsUnsavedModalKeyboard(event)` додано fallback через `event.code === "Escape"`.

## Стало краще
- Підвищено сумісність обробки Escape у середовищах, де `key` може бути варіативним.
- Keyboard-cancel модалки став надійнішим без зміни існуючої UX-поведінки.

## Валідація
- `get_errors` для `admin.js` і `admin.html`: помилок не виявлено.
- grep-перевірка: підтверджено умову `key === "Escape" || key === "Esc" || code === "Escape"` у `handleSettingsUnsavedModalKeyboard`.
- Smoke API: `settingsOk=True; okPage=1; okTotal=5; okItems=1`.
