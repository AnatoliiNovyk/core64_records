# 495 Batch - Admin settings social links control

## Як було

- В адмін-панелі не було полів для керування hero-соцпосиланнями (Instagram, YouTube, SoundCloud, Radio).
- На публічній сторінці ці посилання були статичними (`#`) і не керувались через налаштування.

## Що зроблено

- Додано поля соцпосилань у секцію налаштувань адмінки в [admin.html](admin.html).
- Оновлено `loadSettings/saveSettings` для нових полів у [admin.js](admin.js).
- Розширено дефолтні налаштування та merge локальних даних у [data-adapter.js](data-adapter.js).
- Розширено backend schema валідації в [backend/src/middleware/validate.js](backend/src/middleware/validate.js).
- Розширено SQL запити читання/збереження налаштувань у [backend/src/db/repository.js](backend/src/db/repository.js).
- Оновлено seed для нових колонок у [backend/src/db/seed.js](backend/src/db/seed.js).
- Додано міграцію колонок соцпосилань у [backend/src/db/migrations/004_settings_social_links.sql](backend/src/db/migrations/004_settings_social_links.sql).
- Додано `id` для hero-соцлінків у [index.html](index.html) та прив’язку URL із settings у [app.js](app.js).

## Що покращило

- Тепер соцпосилання hero-блоку повністю керуються з адмін-панелі.
- Зміни зберігаються в БД і віддаються через API/public payload.
- Публічна сторінка автоматично застосовує оновлені URL без ручного редагування коду.
