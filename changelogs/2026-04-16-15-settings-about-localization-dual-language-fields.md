# Settings About Localization Dual Language Fields

## Як було

- У блоці налаштувань адмінки для `Label name`, `About`, `Mission` був лише один набір полів.
- Це створювало плутанину: при перемиканні мови сайту на публічній сторінці могли з'являтися тексти іншою мовою, якщо для відповідної локалі не були явно заповнені окремі значення.
- Backend зберігав локалізовані значення через `settings_i18n`, але UI не давав зручного одночасного редагування обох мов для цих полів.

## Що зроблено

- В `admin.html` оновлено секцію Settings:
  - додано окремі поля `UK` та `EN` для `Label name`, `About`, `Mission`;
  - додано пояснювальний hint про роздільне заповнення локалей;
  - оновлено підключення `admin.js` з новим cache-busting параметром.
- В `admin.js`:
  - додано i18n-ключі для нових полів/підказки;
  - `loadSettings()` тепер завантажує та показує окремі значення `titleUk/titleEn`, `aboutUk/aboutEn`, `missionUk/missionEn`;
  - `saveSettings()` збирає і відправляє обидві локалі в одному запиті, з backward-compatible заповненням `title/about/mission` для активної мови.
- В `backend/src/middleware/validate.js` розширено `settingsSchema` новими полями:
  - `titleUk`, `titleEn`, `aboutUk`, `aboutEn`, `missionUk`, `missionEn`.
- В `backend/src/db/repository.js`:
  - локалізовані адмін-запити повертають явні `titleUk/titleEn`, `aboutUk/aboutEn`, `missionUk/missionEn`;
  - `upsertSettingsHeroSubtitles()` враховує explicit локалізовані поля, щоб зберігати обидві мови за один save;
  - `getAdminSettings()` нормалізує і гарантує наявність explicit UK/EN полів у відповіді.

## Що покращило/виправило/додало

- Керування текстами блоку «Про нас» стало прозорим і контрольованим для обох мов одночасно.
- Зменшено ризик змішування мов на публічному фронтенді при перемиканні `UK/EN`.
- Локалізаційний контракт `settings` узгоджено між UI адмінки, API-валидацією та репозиторним шаром.
