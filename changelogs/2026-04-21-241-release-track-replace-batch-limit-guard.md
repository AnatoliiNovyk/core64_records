## Як було
- У `replaceReleaseTracksByReleaseId` використовувався один Firestore batch для видалення старих треків і запису нових.
- При великій кількості треків сумарна кількість write-операцій могла перевищити Firestore batch limit (500), що могло закінчуватися серверною помилкою.
- Цей сценарій міг проявлятися як нестабільний save при великих релізах.

## Що зроблено
- У `backend/src/db/repository.firestore.js` додано fail-fast guard `RELEASE_TRACK_REPLACE_MAX_WRITE_OPERATIONS` для bulk replace треків.
- Перед запуском replace-операції тепер обчислюється `estimatedWriteOperations = existingTracks + newTracks`.
- Якщо оцінка перевищує безпечний поріг, операція завершується рано з контрольованою помилкою (без спроби виконати batch понад ліміт Firestore).

## Що покращило/виправило/додало
- Усунуто клас падінь на Firestore batch write limit у сценарії масового replace треків.
- Додано прогнозований fail-fast захист замість пізнього падіння під час commit.
- Зменшено ризик повторного `500` у великих релізах під час save.
