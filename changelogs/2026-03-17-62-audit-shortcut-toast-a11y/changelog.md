# Changelog - 2026-03-17 - Audit shortcut toast accessibility

Покращено доступність toast-повідомлення для оновлення через клавіатуру.
Додано live-region атрибути для коректного озвучення скрінрідерами.
Додано мікро-логіку, щоб однакові повідомлення озвучувались повторно.

Файл: `admin.html`

- Для `#audit-shortcut-toast` додано:
- `role="status"`
- `aria-live="polite"`
- `aria-atomic="true"`

Файл: `admin.js`

- Оновлено `showAuditShortcutToast(message)`:
- перед встановленням нового тексту спочатку очищається `textContent`;
- новий текст виставляється через `requestAnimationFrame(...)`.
- Це покращує повторне анонсування одного й того ж toast-повідомлення assistive-технологіями.

Статичні перевірки:

- `admin.js`: без помилок
- `admin.html`: без помилок

Smoke API:

- `okPage=1; okTotal=5; okItems=1`

Фідбек після `Ctrl/Cmd+R` став більш доступним для користувачів зі скрінрідерами без зміни основного UX.
