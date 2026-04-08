# 2026-04-08-09 Admin Sections Headings And Buttons I18n

## Як було

- У секціях Releases/Artists/Events/Sponsors в адмінці заголовки і кнопки додавання були статичними українськими рядками.
- У режимі Eng sidebar вже перекладався, але заголовки секцій та CTA-кнопки в main content лишалися українськими.

## Що зроблено

- У [admin.html](admin.html) додано `data-i18n` для:
  - заголовків секцій Releases/Artists/Events/Sponsors
  - текстів кнопок `Add ...` у цих секціях
- У [admin.js](admin.js) розширено словники `ADMIN_I18N` (UK/EN) новими ключами:
  - `releasesSectionTitle`, `releasesAddButton`
  - `artistsSectionTitle`, `artistsAddButton`
  - `eventsSectionTitle`, `eventsAddButton`
  - `sponsorsSectionTitle`, `sponsorsAddButton`
- Перевірено:
  - diagnostics для `admin.html` і `admin.js`
  - `npm run ui-smoke` (passed)

## Що покращило/виправило/додало

- Усунуто змішування мов у центральному контенті адмінки.
- Режим Eng тепер коректно перекладає заголовки і ключові кнопки в секціях контент-менеджменту.
- Підвищено консистентність локалізації між sidebar і робочими секціями.
