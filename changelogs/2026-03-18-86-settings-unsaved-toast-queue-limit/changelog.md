# Changelog - 2026-03-18 - Settings unsaved toast queue limit

Додано ліміт довжини черги для `settings-unsaved` toast-повідомлень.
Черга обмежена до 5 елементів, щоб запобігти показу застарілих повідомлень після довгої серії подій.

Файл: `admin.js`

- Додано константу:
- `SETTINGS_UNSAVED_TOAST_QUEUE_LIMIT = 5`
- Оновлено `showSettingsUnsavedToast(message, tone)`:
- перед додаванням нового повідомлення перевіряє ліміт;
- якщо ліміт досягнуто, видаляє найстаріший елемент черги (`shift()`).

Статичні перевірки:

- `admin.js`: без помилок
- `admin.html`: без помилок

Smoke API:

- `settingsOk=True; okPage=1; okTotal=5; okItems=1`

Поведінка toast лишається послідовною, але без «відкладеного спаму» застарілими повідомленнями.
