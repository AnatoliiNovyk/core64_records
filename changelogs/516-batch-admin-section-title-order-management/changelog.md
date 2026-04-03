# 516 Batch - admin section title/order management

## Як було

- Заголовки публічних секцій (`releases`, `artists`, `events`, `sponsors`) і їх порядок були жорстко зашиті у фронтенді.
- Адмінка не мала інструмента для редагування заголовків секцій (uk/en) та зміни порядку секцій.

## Що зроблено

- Додано нову міграцію `backend/src/db/migrations/011_section_settings.sql`:
  - `section_settings` (ключ секції, порядок, enabled, default_title)
  - `section_settings_i18n` (локалізовані заголовки)
  - backfill дефолтних значень для `releases/artists/events/sponsors` у `uk/en`.
- Розширено backend repository:
  - `getAdminSectionSettings()`
  - `getPublicSectionSettings(language)`
  - `saveSectionSettings(sectionsPayload)` (транзакційне збереження).
- Розширено backend валідацію:
  - `sectionSettingSchema`
  - `sectionSettingsSchema` (перевірка duplicate `sectionKey` і `sortOrder`).
- Додано API ендпоїнти:
  - `GET /api/settings/sections`
  - `PUT /api/settings/sections`
- Розширено `/api/public` полем `sectionSettings` для локалізованих title/order.
- Розширено data-adapter:
  - `getSectionSettings()`
  - `saveSectionSettings(payload)`
  - локальний fallback для section settings.
- Оновлено адмінку:
  - у settings додано блок "Заголовки та порядок секцій"
  - редагування `Title UK`/`Title EN`
  - кнопки `Вгору/Вниз` для reorder
  - інтеграція з існуючим `saveSettings()`.
- Оновлено публічний фронтенд:
  - динамічне застосування title/order із `data.sectionSettings`
  - fallback на дефолтні i18n заголовки
  - рендер секцій у порядку з адмінки.

## Що покращило

- Адмін отримав керування заголовками секцій і їх порядком без правок коду.
- Підтримано локалізацію `uk/en` для нових керованих заголовків.
- Публічна сторінка синхронізується з адмін-налаштуваннями секцій.
