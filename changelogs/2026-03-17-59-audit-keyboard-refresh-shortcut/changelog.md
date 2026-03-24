# Changelog - 2026-03-17 - Audit keyboard refresh shortcut

Додано гарячу клавішу для швидкого ручного оновлення журналу аудиту:

- `Ctrl+R` (Windows/Linux)
- `Cmd+R` (macOS)

У секції аудиту шорткат перехоплюється без перезавантаження сторінки і викликає `refreshAuditNow()`.

Файл: `admin.js`
Додано функцію:

- `handleAuditKeyboardShortcuts(event)`

Логіка:

- працює лише коли `currentSection === "audit"`;
- перевіряє комбінацію `(ctrlKey || metaKey) + R` без `Alt/Shift`;
- викликає `event.preventDefault()`;
- тригерить `refreshAuditNow()` з обробкою помилок через `handleAuditLoadError(...)`.

Реєстрація listener:

- у `DOMContentLoaded` додано `document.addEventListener("keydown", handleAuditKeyboardShortcuts)`.

Статична перевірка:

- `admin.js`: без помилок

Smoke API:

- `okPage=1; okTotal=5; okItems=1`

Оновлення аудиту стало швидшим для power-users без необхідності клікати кнопку вручну.
