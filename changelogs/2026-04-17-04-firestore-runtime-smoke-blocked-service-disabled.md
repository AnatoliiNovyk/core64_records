# 2026-04-17-04 Firestore Runtime Smoke Blocked Service Disabled

## Як було

- Після реалізації write/admin контрактів для Firestore потрібно було підтвердити рантайм-працездатність через локальний API smoke у режимі `DATA_BACKEND=firestore`.
- До перевірки сервер не був запущений локально, тому первинний smoke не міг стартувати.

## Що зроблено

- Піднято локальний backend у Firestore-режимі:
- `DATA_BACKEND=firestore`;
- `FIRESTORE_PROJECT_ID=core64records`;
- `GOOGLE_APPLICATION_CREDENTIALS=core64records-0a442b8aa8ec.json`.
- Виконано `node scripts/smoke-check.mjs` проти `http://localhost:3000/api`.
- Зібрано та проаналізовано server logs для всіх 5xx з smoke.
- Зафіксовано кореневу причину падіння:
- gRPC `PERMISSION_DENIED` code `7`;
- причина `SERVICE_DISABLED` для `firestore.googleapis.com`;
- вказаний activation URL у відповіді Google API для проєкту `core64records`.

## Що покращило/виправило/додало

- Підтверджено, що поточний блокер smoke не в коді репозиторію, а в конфігурації GCP-проєкту (вимкнений Firestore API).
- Відокремлено інфраструктурну проблему від application-level регресій, що знижує ризик хибної відладки коду.
- Підготовлено чіткий наступний крок для повного runtime validation: увімкнути `firestore.googleapis.com` для `core64records`, дочекатися propagation, повторити smoke.
