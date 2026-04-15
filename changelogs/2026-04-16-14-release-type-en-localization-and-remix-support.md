# Release Type EN Localization And Remix Support

## Як було

- На публічному фронтенді бейджі формату релізу були захардкожені частково українською (`Сингл`, `Альбом`), тому в англійському інтерфейсі частина тексту залишалась неанглійською.
- У формі редагування релізу в адмінці список `Release format` містив лише `Single`, `EP`, `Album`.
- Backend-валидація та DB check constraint для `release_type` не підтримували значення `remix`.

## Що зроблено

- У `app.js` виправлено публічну локалізацію формату релізу:
  - додано i18n-ключі `releaseTypeSingleLabel`, `releaseTypeEpLabel`, `releaseTypeAlbumLabel`, `releaseTypeRemixLabel` для `uk/en`;
  - `getReleaseTypeLabel()` переведено на `tPublic(...)`, без захардкожених українських рядків;
  - `normalizeReleaseTypeValue()` розширено для коректного мапінгу legacy-значень (`сингл`, `альбом`, `ремікс/ремикс`) і нового `remix`.
- У `admin.js` додано новий формат релізу:
  - новий словниковий ключ `releaseTypeRemixLabel` (`Ремікс` / `Remix`);
  - новий пункт `<option value="remix">Remix</option>` у випадаючому списку `Release format`;
  - `RELEASE_TYPE_OPTIONS` і `normalizeReleaseTypeValue()` оновлено для `remix` та legacy-значень.
- У `backend/src/middleware/validate.js` `releaseSchema.releaseType` розширено до `single|ep|album|remix`.
- Додано міграцію `backend/src/db/migrations/017_releases_release_type_remix.sql`:
  - нормалізація legacy-значень у БД,
  - перевстановлення check constraint із дозволеним `remix`.
- Оновлено cache-busting версію `app.js` у `index.html`.

## Що покращило/виправило/додало

- В англійському режимі на публічному сайті формат релізу тепер показується англійською, без випадкових українських бейджів.
- Адмінка отримала новий повноцінний формат релізу `Remix` у формі редагування/створення.
- Контракт `release_type` став узгодженим між UI, API-валидацією і DB constraint, що усуває помилки збереження для `remix`.
