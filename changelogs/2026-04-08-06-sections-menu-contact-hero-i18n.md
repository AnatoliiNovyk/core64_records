# 2026-04-08-06 Sections Menu Contact Hero I18n

## Як було
- У section settings не було окремих menu labels для UK/EN.
- Секція CONTACT не була повноцінною частиною керованих section settings.
- Hero subtitle на public був статичним текстом у markup і не редагувався з адмінки.
- У модальному CRUD-редакторі та частині UI були жорстко зашиті тексти без повної мовної адаптації.

## Що зроблено
- Backend:
  - Розширено валідацію `settings` (`heroSubtitleUk`, `heroSubtitleEn`) та `section settings` (`menuTitleUk`, `menuTitleEn`, `contact` section key).
  - Розширено repository mapping для `menuTitle*` і `heroSubtitle*` з fallback-сумісністю.
  - Додано SQL-міграцію `013_section_settings_contact_nav_title_and_hero_subtitle.sql`:
    - `section_settings_i18n.nav_title`
    - seed/backfill для `contact` section
    - `settings_i18n.hero_subtitle` + backfill
- Frontend/public:
  - Додано підтримку `menuTitle` окремо від `title` у рендері навігації.
  - Додано CONTACT у керований список секцій (desktop/mobile nav + visibility rules).
  - Додано binding hero subtitle з `settings` у `#public-hero-subtitle`.
  - Локалізовано тексти квитків і empty-state партнерської секції.
- Frontend/admin:
  - Розширено section settings editor: title UK/EN + menu title UK/EN, включно з CONTACT.
  - Додано поля `Hero subtitle (UK/EN)` у налаштуваннях адмінки.
  - Локалізовано modal action buttons (`Save/Cancel`) та основні labels у CRUD-модалках залежно від активної мови.

## Що покращило/виправило/додало
- Усунуто змішування понять section heading і navigation label.
- CONTACT став керованою секцією в єдиному контракті налаштувань.
- Hero subtitle став керованим контентом через адмінку і API.
- Покращено консистентність UX між UK/EN у критичних admin/public сценаріях.
- Підготовлено сумісний DB/API фундамент для подальшого розширення локалізованих section settings.
