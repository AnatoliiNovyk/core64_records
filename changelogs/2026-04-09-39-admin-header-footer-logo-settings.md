## Як було
- У налаштуваннях адмінки не було полів для керування логотипами хедера/футера.
- Публічна сторінка використовувала лише статичну бренд-іконку CPU та текст CORE64 у header і footer.
- Settings-контракт та аудит не відстежували окремі поля для logo URL.

## Що зроблено
- Додано міграцію [backend/src/db/migrations/014_settings_header_footer_logos.sql](backend/src/db/migrations/014_settings_header_footer_logos.sql) з колонками `header_logo_url` і `footer_logo_url`.
- Розширено backend settings-схему та мапінг:
  - [backend/src/middleware/validate.js](backend/src/middleware/validate.js): `headerLogoUrl`, `footerLogoUrl`.
  - [backend/src/db/repository.js](backend/src/db/repository.js): INSERT/UPDATE/SELECT для admin/public settings.
  - [backend/src/utils/settingsAuditDiff.js](backend/src/utils/settingsAuditDiff.js): включено logo-поля у tracked diff.
- Оновлено fallback settings в [data-adapter.js](data-adapter.js).
- Додано поля в адмінці та wiring save/load:
  - [admin.html](admin.html): два нові input для URL/шляху логотипів.
  - [admin.js](admin.js): i18n-лейбли (UK/EN), завантаження значень у форму, збереження в payload, DOM-guards.
- Додано рендер логотипів на public:
  - [index.html](index.html): target-елементи `public-header-logo`/`public-footer-logo` + fallback-іконки.
  - [app.js](app.js): нормалізація logo URL, безпечне застосування і fallback на іконки при порожньому/битому source.
- Синхронізовано контрактні перевірки:
  - [scripts/check-settings-i18n-consistency.mjs](scripts/check-settings-i18n-consistency.mjs)
  - [scripts/test-check-settings-i18n-consistency.mjs](scripts/test-check-settings-i18n-consistency.mjs)
  - [scripts/settings-public-contract-check.mjs](scripts/settings-public-contract-check.mjs)

## Що покращило / виправило / додало
- Додано можливість керувати логотипами header/footer через адмінку без зміни коду.
- Забезпечено наскрізну сумісність persistence-циклу `PUT /settings -> GET /settings -> GET /public` для нових полів.
- Збережено стабільний fallback UX: якщо logo URL порожній або недійсний, відображається поточний бренд (іконка + текст).
- Підсилено release-надійність за рахунок оновлених contract-check і audit diff coverage для нових полів.
