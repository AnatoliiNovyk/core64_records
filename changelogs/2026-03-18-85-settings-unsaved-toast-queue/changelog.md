# Changelog - 2026-03-18 - Settings unsaved toast queue

Додано чергу toast-повідомлень для `settings-unsaved` UX, щоб швидкі послідовні події не перезаписували одна одну.
Тепер повідомлення відображаються послідовно, у порядку надходження.

Файл: `admin.js`

- Додано стан черги:
- `settingsUnsavedToastActive`
- `settingsUnsavedToastQueue`
- Додано `processSettingsUnsavedToastQueue()`:
- бере наступний елемент із черги;
- показує toast з відповідним `tone`;
- після timeout запускає показ наступного повідомлення.
- Оновлено `showSettingsUnsavedToast(message, tone)`:
- тепер додає повідомлення в чергу й запускає процесор.

Статичні перевірки:

- `admin.js`: без помилок
- `admin.html`: без помилок

Smoke API:

- `settingsOk=True; okPage=1; okTotal=5; okItems=1`

UX toast-повідомлень став стабільнішим: жодне важливе повідомлення не губиться при швидкій серії дій.
