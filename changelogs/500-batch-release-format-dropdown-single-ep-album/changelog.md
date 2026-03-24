# 500 Batch - Release format dropdown (Сингл / EP / Альбом)

## Як було

- У релізів не було окремого поля формату релізу.
- В адмінці не існувало випадаючого списку для вибору типу релізу.
- У БД/API модель релізу не містила `releaseType`.

## Що зроблено

- Додано нове поле `releaseType` з варіантами:
  - `single` (Сингл)
  - `ep` (EP)
  - `album` (Альбом)
- В адмін-формі релізу додано dropdown "Формат релізу" у [admin.js](admin.js).
- У списку релізів адмінки додано відображення формату релізу поряд із жанром і роком у [admin.js](admin.js).
- На публічній сторінці у картці релізу бейдж зверху праворуч тепер показує формат (Сингл/EP/Альбом), а жанр винесено в нижній мета-рядок у [app.js](app.js).
- Розширено backend валідацію релізу полем `releaseType` у [backend/src/middleware/validate.js](backend/src/middleware/validate.js).
- Розширено репозиторій БД для читання/збереження `release_type` і мапінгу `releaseType` у [backend/src/db/repository.js](backend/src/db/repository.js).
- Додано міграцію [backend/src/db/migrations/005_releases_release_type.sql](backend/src/db/migrations/005_releases_release_type.sql).
- Оновлено seed у [backend/src/db/seed.js](backend/src/db/seed.js).
- Оновлено локальні дефолти в [data-adapter.js](data-adapter.js).

## Що це покращило

- Тепер формат релізу керується централізовано через адмінку.
- Формат зберігається у БД, проходить API і коректно показується на фронтенді.
- Користувач бачить чітку класифікацію релізів: Сингл / EP / Альбом.
