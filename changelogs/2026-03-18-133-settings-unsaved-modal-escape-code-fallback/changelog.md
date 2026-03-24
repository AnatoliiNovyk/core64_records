# 2026-03-18 #133 — Settings Unsaved Modal Escape Code Fallback

Закриття модалки незбережених змін з клавіатури спиралось на `event.key` (`Escape` / `Esc`).

У `handleSettingsUnsavedModalKeyboard(event)` додано fallback через `event.code === "Escape"`.

Підвищено сумісність обробки Escape у середовищах, де `key` може бути варіативним.
Keyboard-cancel модалки став надійнішим без зміни існуючої UX-поведінки.

`get_errors` для `admin.js` і `admin.html`: помилок не виявлено.
grep-перевірка: підтверджено умову `key === "Escape" || key === "Esc" || code === "Escape"` у `handleSettingsUnsavedModalKeyboard`.
Smoke API: `settingsOk=True; okPage=1; okTotal=5; okItems=1`.
