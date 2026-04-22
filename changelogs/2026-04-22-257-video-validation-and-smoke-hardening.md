# 2026-04-22-257 Video Validation And Smoke Hardening

## Як було
- Backend приймав YouTube URL за перевіркою хоста, але без гарантії валідного video ID для embed.
- `scripts/smoke-check.mjs` перевіряв для `videos` переважно наявність масиву/лічильника.
- `scripts/ui-smoke.mjs` не покривав реальний UI CRUD-сценарій для video в адмінці.

## Що зроблено
- Посилено backend валідацію YouTube URL у `backend/src/middleware/validate.js`:
  - додано обов'язкове виділення валідного 11-символьного video ID (watch, youtu.be, shorts, embed).
  - URL без валідного ID більше не проходять `videoSchema`.
- Розширено API smoke у `scripts/smoke-check.mjs`:
  - додано `extractYouTubeVideoId` і `getVideosQuality`.
  - додано quality-перевірки `videos` (title, youtubeUrl, embeddable ID, sortOrder >= 0 integer).
  - smoke переводиться у fail, якщо quality-метрики мають порушення.
- Розширено UI smoke у `scripts/ui-smoke.mjs`:
  - додано `runVideoUiCrudFlow` з реальним UI create/update video через модалку в адмінці.
  - додано API-верифікацію змінених даних після UI submit.
  - додано перевірку рендера public videos grid (наявність title + iframe embed).
  - додано cleanup створеного тестового відео.
- Оновлено self-test fixture у `scripts/test-smoke-check.mjs`:
  - додано `sortOrder` для mock video, щоб відповідати новим quality checks.

## Що покращило/виправило/додало
- Усунуто розрив між server-side валідацією і frontend embed-логікою для YouTube URL.
- Smoke тепер ловить «тихі» проблеми videos-даних до продакшену.
- UI smoke почав покривати критичний admin->api->public Video flow.
- Фактичний статус перевірок після змін:
  - `node scripts/test-smoke-check.mjs` -> PASSED.
  - `node scripts/smoke-check.mjs` -> FAIL у локальному середовищі через 404 endpoint mismatch/security headers.
  - `npm run ui-smoke` -> FAIL на API preflight (`/health` -> 404 у поточному локальному рантаймі).
