# 2026-04-09-07 About Heading Label Parity And Contract Title Check

## Як було

- На публічній сторінці заголовок секції About брався зі статичного i18n ключа `sectionAbout` і не відображав значення Label Name з адмінки.
- Через це виникала видима розбіжність: в налаштуваннях зберігався `setting-title`, але в About показувався інший текст.
- Контрактний тест `settings-public-contract-check` перевіряв тільки `about/mission` і не ловив можливу регресію по `title`.
- У backend нормалізації section settings зберігались legacy fallback alias-и `navTitle*`, які не використовувались актуальним payload/select шляхом.

## Що зроблено

- У `index.html` для заголовка About додано `id="public-section-title-about"` для керованого оновлення з JS.
- У `app.js` (функція `loadAbout`) додано явну прив'язку заголовка About до `settings.title`.
- Додано fallback: якщо `settings.title` порожній, використовується локалізований `tPublic("sectionAbout")`.
- У `scripts/settings-public-contract-check.mjs` додано перевірку `title` для `GET /public?lang=uk|en` після `PUT /settings`.
- У `backend/src/db/repository.js` виконано low-risk cleanup: прибрано застарілі fallback alias-и `row.navTitleUk/row.nav_title_uk` та `row.navTitleEn/row.nav_title_en`.
- Виконано перевірки:
  - `node scripts/smoke-check.mjs` (з `CORE64_API_BASE=http://127.0.0.1:3000/api`) — passed.
  - `npm run contract-check:settings-public` (з `CORE64_API_BASE=http://127.0.0.1:3000/api`) — passed.
  - `npm run ui-smoke` (з `CORE64_API_BASE=http://127.0.0.1:3000/api`) — passed.

## Що покращило/виправило/додало

- Усунено розбіжність між Label Name в адмінці та заголовком About на публічній сторінці.
- Додано захист від регресії по `settings.title` на рівні контрактного тесту settings -> public.
- Зменшено технічний шум у backend нормалізації без зміни зовнішнього API контракту.
- Поліпшено стабільність локального прогону smoke/contract/UI перевірок через явний API base `127.0.0.1`.
