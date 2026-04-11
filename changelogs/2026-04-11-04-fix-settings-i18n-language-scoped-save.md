## Як було
- При збереженні налаштувань `title/about/mission` бекенд записував однакові значення одразу в `settings_i18n` для `uk` і `en`.
- Запити `PUT /api/settings` і `PUT /api/settings/bundle` з фронтенду не передавали активну мову (`lang`), тому бекенд не міг зрозуміти, яку локаль оновлює користувач.
- У результаті при перемиканні `UK/EN` на публічній сторінці текст блоку "Про нас" міг лишатися англійським і для `UK`.

## Що зроблено
- У `data-adapter.js` для збереження settings додано мовний query-параметр:
  - `PUT /settings?lang=...`
  - `PUT /settings/bundle?lang=...`
- У `backend/src/routes/settings.js` додано `resolveLanguage(req.query.lang)` і прокидання мови в:
  - `getAdminSettings(...)`
  - `saveSettings(...)`
  - `saveSettingsBundle(...)`
- У `backend/src/db/repository.js` перероблено upsert для `settings_i18n`:
  - локалізовані поля (`title/about/mission/captcha messages`) оновлюються для активної мови,
  - неактивна мова зберігає наявний переклад,
  - `heroSubtitleUk/heroSubtitleEn` продовжують оновлюватися окремо для обох мов.
- Додано локалізований admin-select для settings з fallback на legacy/non-i18n запити.

## Що покращило/виправило/додало
- Виправлено дрейф локалізації: `UK/EN` перемикач тепер працює коректніше для текстів settings, зокрема блоку "Про нас".
- При редагуванні однієї мови більше не перезаписується переклад іншої мови.
- Підвищено стабільність i18n-поведінки без зміни API-контрактів для існуючих клієнтів (збережено fallback-шляхи).
