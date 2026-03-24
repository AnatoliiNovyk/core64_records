# Changelog - 2026-03-18 - Settings unsaved toast title sync

Динамічні стани toast оновлювали `aria-label`, але `title` залишався статичним із HTML.
Tooltip для миші міг не відповідати актуальному повідомленню та черзі.

Файл: admin.js

- У `updateSettingsUnsavedToastAriaLabel()` синхронізовано `title` з обчисленим текстом стану.
- Додано покриття для всіх гілок:
- порожній стан (дефолтна підказка);
- тільки pending queue;
- тільки поточне повідомлення;
- поточне повідомлення + queue.

Tooltip миші і `aria-label` тепер узгоджені.
Менше розбіжностей між візуальною та assistive-підказкою.
Краще пояснення стану черги без додаткових кліків.

Статичні перевірки:

- admin.js: без помилок
- admin.html: без помилок

Smoke API:

- settingsOk=True; okPage=1; okTotal=5; okItems=1
