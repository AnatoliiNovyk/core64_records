# Release Player Stream Audio Fallback

## Як було

- Публічний compact player залежав від повного `GET /api/release-tracks/:releaseId` з `audioDataUrl` для всіх треків одразу.
- На великих релізах повний endpoint міг повертати `500`, через що у фронтенді треки відфільтровувались як порожні і показувалось `No tracks have been added...`.
- В адмінці після meta-first завантаження треків були назви/тривалості, але preview аудіо не відтворювався без окремого джерела.

## Що зроблено

- У backend додано метод репозиторію `getReleaseTrackById(...)` для читання одного треку з `audio_data_url`.
- Додано новий endpoint `GET /api/release-tracks/:releaseId/:trackId/audio`, який:
  - валідує release/track id,
  - дістає один трек,
  - парсить data URL,
  - повертає бінарний аудіо-потік з коректним `Content-Type`.
- У `data-adapter.js`:
  - `getReleaseTracks(...)` отримав fallback на `meta`, якщо повний endpoint падає з `5xx/413`,
  - додано `getReleaseTrackAudioStreamUrl(...)` для формування URL потокового відтворення одного треку.
- У `app.js` compact player:
  - більше не відкидає треки без inline `audioDataUrl`, якщо є `track.id`,
  - при відтворенні використовує inline blob або stream URL одного треку,
  - додає повідомлення `track unavailable` для випадку, коли джерело аудіо недоступне.
- У `admin.js` редактор релізу:
  - для existing tracks без inline blob використовує stream URL одного треку,
  - повертає аудіо preview/control без повторного upload файлу.

## Що покращило/виправило/додало

- Виправлено «порожній» плеєр на фронтенді у сценарії, коли full release-tracks endpoint не витримує великий payload.
- Адмінка знову дає можливість прослухати existing треки в редакторі, навіть якщо список завантажено в meta-режимі.
- Прибрано залежність UI від монолітної важкої відповіді з усіма base64 аудіо одразу.
- Підвищено стійкість реліз-плеєра завдяки fallback-архітектурі: meta список + stream одного треку за потреби.
