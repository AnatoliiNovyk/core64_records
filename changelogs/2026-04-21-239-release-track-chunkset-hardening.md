## Як було
- Для великих треків already був доданий chunking, але запис треку і запис chunk-даних не був достатньо стійким до часткових збоїв.
- У випадку помилки між кроками оновлення можна було отримати неузгоджений стан (рядок треку оновлено, а chunk-набір неповний або застарілий).
- Для chunked-треків не зберігався явний ідентифікатор набору чанків, що ускладнювало безпечне перемикання між версіями аудіо.

## Що зроблено
- У `backend/src/db/repository.firestore.js` додано `audioChunkSetId` і генерацію `chunk set` для кожного нового chunked payload.
- Додано двофазний підхід для release tracks:
  - спочатку записується новий chunk set;
  - потім фіксується рядок треку/списку треків;
  - після успіху виконується best-effort cleanup попередніх чанків.
- Для `replaceReleaseTracksByReleaseId` додано rollback-cleanup нових chunk set-ів, якщо коміт batch у `release_tracks` не пройшов.
- Для `updateReleaseTrackById` додано cleanup новоствореного chunk set при помилці `found.ref.set(...)`.
- Для `createReleaseTrackByReleaseId` додано cleanup chunk set при помилці запису рядка треку.
- Для читання chunked аудіо додано більш надійний відбір чанків (з урахуванням `chunkSetId` і backward-compatible fallback).

## Що покращило/виправило/додало
- Зменшено ризик отримати "битий" трек при частковому збої під час save.
- Додано явне версіонування наборів chunk-даних (`audioChunkSetId`), що робить оновлення аудіо передбачуванішим.
- Підвищено стійкість операцій `create/update/replace/delete` для release tracks у Firestore.
- Збережено сумісність з уже існуючими записами chunk-даних.
