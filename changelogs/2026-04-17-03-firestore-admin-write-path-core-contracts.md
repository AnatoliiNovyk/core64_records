# 2026-04-17-03 Firestore Admin Write Path Core Contracts

## Як було

- Після етапу foundation та public read-path у Firestore-репозиторії більшість admin/write операцій залишались заглушками `FIRESTORE_NOT_IMPLEMENTED`.
- CRUD для колекцій (`releases|artists|events|sponsors`) у режимі `DATA_BACKEND=firestore` не працював, що блокувало збереження з адмінки.
- Не було реальної реалізації для release tracks, settings bundle, section settings, contact requests та audit logs у Firestore backend.

## Що зроблено

- У `backend/src/db/repository.firestore.js` додано контрактний helper-шар для Firestore:
- генерація числових ID через `_meta/counters` з транзакціями;
- пошук документів за numeric `id` і fallback по doc id;
- нормалізація payload для `releases|artists|events|sponsors`;
- злиття локалізацій `translations` із fallback-логікою;
- нормалізація release tracks, contact requests, audit details;
- резолвер єдиного settings-документа.
- Реалізовано collection write-path:
- `createByType`, `updateByType`, `deleteByType`;
- підтримано узгоджений shape API-відповідей у camelCase.
- Реалізовано release tracks suite:
- `listReleaseTracksByReleaseId`, `listReleaseTrackMetaByReleaseId`, `getReleaseTrackById`;
- `replaceReleaseTracksByReleaseId`, `createReleaseTrackByReleaseId`, `updateReleaseTrackById`, `deleteReleaseTrackById`.
- Реалізовано settings/sections suite:
- `getAdminSectionSettings`, `saveSectionSettings`;
- `saveSettingsBundle`, `getAdminSettings`, `saveSettings`;
- публічні/адмінні поля captcha, hero subtitle, latency thresholds, uk/en локалізації.
- Реалізовано contact requests suite:
- `createContactRequest`, `listContactRequests`, `updateContactRequestStatus`.
- Реалізовано audit suite:
- `writeAuditLog`, `listAuditLogs`, `listAuditFacets`;
- компактне представлення details для list endpoint і безпечні фільтри (action/entity/q/date range).
- Проведено статичну валідацію після змін:
- синтаксис `repository.firestore.js` і ключових route-файлів;
- diagnostics check без помилок.

## Що покращило/виправило/додало

- Режим `DATA_BACKEND=firestore` перейшов від часткової read-only реалізації до широкого робочого admin/write контуру.
- Знято критичні блокери міграції для адмінки: тепер backend має реальні Firestore-обробники для основних CRUD та сервісних потоків.
- Збережено сумісність контрактів роутів і payload shape, що зменшує ризик регресій на фронтенді під час переключення backend.
- Підготовлено базу для наступного кроку: повний інтеграційний smoke у Firestore-режимі та добивання edge-parity за результатами рантайм перевірок.
