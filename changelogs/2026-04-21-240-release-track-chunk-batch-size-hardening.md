## Як було
- Під час збереження релізу з кількома треками (зокрема після додавання другого треку з великим MP3/WAV) API міг повертати `500 INTERNAL_SERVER_ERROR`.
- У `writeReleaseTrackAudioChunks` запис chunk-документів у Firestore комітився лише за лічильником операцій (`>=300`) без контролю сумарного розміру запиту.
- Для великих аудіо це могло перевищувати Firestore limit на розмір commit request (10 MiB) і падати в unhandled 500.

## Що зроблено
- У `backend/src/db/repository.firestore.js` посилено batching chunk-записів:
  - додано безпечний поріг `RELEASE_TRACK_AUDIO_BATCH_MAX_WRITES`;
  - додано поріг `RELEASE_TRACK_AUDIO_BATCH_MAX_ESTIMATED_BYTES`;
  - додано оцінку розміру запису `estimateReleaseTrackAudioChunkWriteBytes(...)`;
  - commit батчу тепер виконується до перевищення write-count/estimated-bytes порогів.
- У `backend/src/utils/dbError.js` розширено сигнатури storage-limit повідомлень для Firestore request-size/write-limit сценаріїв, щоб уникати generic error-класифікації у схожих кейсах.

## Що покращило/виправило/додало
- Зменшено ризик `500` при збереженні релізу з великими аудіотреками у Firestore.
- Запис chunk-даних став стійкішим до обмежень commit request size.
- У крайніх випадках лімітів зросла ймовірність коректної класифікації помилки (замість загального `Internal server error`).
