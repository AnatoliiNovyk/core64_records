# Release Edit Meta Load And Partial Track Update

## Як було

- Під час відкриття Edit для релізу адмінка намагалася завантажити повні треки через `GET /api/release-tracks/:releaseId`.
- Для релізів з великими `audioDataUrl` цей запит міг падати, після чого користувач бачив `Failed to load release tracks`.
- Валідація та backend-оновлення вимагали `audioDataUrl` навіть для існуючих треків, тому редагування назви/порядку без повторного upload старих аудіо було нестабільним.

## Що зроблено

- У frontend (`data-adapter.js`) додано `getReleaseTracksForEdit(...)`, який використовує lightweight endpoint `GET /release-tracks/:releaseId/meta` для редактора релізу.
- В `admin.js` потік `openModal(release)` переведено на meta-first завантаження треків, із fallback на старий метод лише коли meta-route недоступний.
- Додано strict guard у `admin.js`: якщо треки не завантажились у режимі редагування, save блокується з явним повідомленням про необхідність повторно відкрити редагування.
- Додано стан `audioPreserved` для існуючих треків без локально завантаженого blob, щоб редагувати title/sort без примусового повторного upload.
- Оновлено payload-підготовку в `admin.js` і `data-adapter.js`: для existing tracks `PUT` може надсилати оновлення без `audioDataUrl`, для new tracks `POST` залишився з обовʼязковим аудіо.
- У backend:
  - додано `releaseTrackUpdateSchema` (optional `audioDataUrl`) у `backend/src/middleware/validate.js`,
  - застосовано його для `PUT /release-tracks/:releaseId/:trackId` у `backend/src/routes/releaseTracks.js`,
  - в `updateReleaseTrackById(...)` (`backend/src/db/repository.js`) оновлення `audio_data_url` виконується тільки якщо поле реально передано.

## Що покращило/виправило/додало

- Виправлено помилку відкриття редагування релізу, повʼязану з важким завантаженням треків.
- Прибрано потребу повторно завантажувати старі аудіофайли для звичайного редагування існуючих треків.
- Додано захист від ризику втрати треків: save не виконується, якщо початкове завантаження треків у модалку провалилося.
- Підвищено сумісність зі змішаними версіями backend через контрольований fallback при недоступності meta-route.
