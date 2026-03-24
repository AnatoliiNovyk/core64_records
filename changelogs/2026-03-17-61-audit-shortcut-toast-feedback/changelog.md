# Changelog - 2026-03-17 - Audit shortcut toast feedback

Додано короткий toast-повідомлення після оновлення аудиту через гарячу клавішу.
Текст шорткату в toast і підказці уніфіковано за платформою (`Ctrl+R` або `Cmd+R`).

Файл: `admin.html`

- Додано елемент `#audit-shortcut-toast` (fixed toast у правому нижньому куті).

Файл: `admin.js`

- Додано стан: `auditShortcutToastTimer`.
- Додано `getAuditShortcutLabel()` для визначення правильного шорткату за ОС.
- Оновлено `updateAuditShortcutHint()` для використання `getAuditShortcutLabel()`.
- Додано `showAuditShortcutToast(message)` з auto-hide (1600ms).
- `handleAuditKeyboardShortcuts(event)` тепер:
- після успішного `refreshAuditNow()` показує toast,
- при помилці показує існуюче error-повідомлення.

Статичні перевірки:

- `admin.js`: без помилок
- `admin.html`: без помилок

Smoke API:

- `okPage=1; okTotal=5; okItems=1`

Користувач отримує явний фідбек про успішне оновлення, коли використовує `Ctrl/Cmd+R` у секції аудиту.
