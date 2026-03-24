# Changelog - 2026-03-18 - Settings unsaved toast Escape dismiss

`settings-unsaved` toast можна було закрити клавіатурою лише через Enter або пробіл.
У tooltip/ARIA-підказках також згадувались тільки Enter/пробіл.

Файл: `admin.js`

- Оновлено `dismissSettingsUnsavedToast(event)`:
- додано підтримку `Escape` як валідної клавіші для закриття toast.
- Оновлено тексти в `updateSettingsUnsavedToastAriaLabel()`:
- підказки тепер містять `Enter, пробіл або Escape`.

Файл: `admin.html`

- Оновлено `title` у `#settings-unsaved-toast`:
- тепер явно вказано, що закриття доступне через `Enter`, `пробіл` або `Escape`.

Покращено клавіатурну доступність і передбачуваність взаємодії з toast.
Узгоджено візуальні та ARIA-підказки з реальною поведінкою.

Статичні перевірки:

- `admin.js`: без помилок
- `admin.html`: без помилок

Smoke API:

- `settingsOk=True; okPage=1; okTotal=5; okItems=1`
