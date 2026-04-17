# 2026-04-17-05 Firestore Emulator Runtime Smoke Pass

## Як було

- Runtime smoke для `DATA_BACKEND=firestore` був заблокований на cloud-середовищі через `SERVICE_DISABLED` для `firestore.googleapis.com`.
- Через відсутність потрібних IAM-прав увімкнути API напряму в GCP-проєкті `core64records` не вдалося.

## Що зроблено

- Встановлено та запущено локальний `Firestore Emulator` на `127.0.0.1:8787`.
- Піднято backend у firestore-режимі проти емулятора:
- `DATA_BACKEND=firestore`;
- `FIRESTORE_PROJECT_ID=core64records`;
- `FIRESTORE_EMULATOR_HOST=127.0.0.1:8787`.
- Засіяно мінімальний валідний набір даних через API:
- `PUT /settings` з валідними полями (включно з audit latency thresholds);
- створено 2 релізи з не-placeholder `image` і валідними `link`.
- Повторно виконано `node scripts/smoke-check.mjs` з `CORE64_API_BASE=http://localhost:3000/api`.
- Отримано повний позитивний результат smoke: `passed: true`.

## Що покращило/виправило/додало

- Підтверджено end-to-end працездатність Firestore runtime-контрактів незалежно від блокера cloud API.
- Доведено, що реалізований Firestore-репозиторій коректно проходить health/public/admin/contact/rate-limit smoke-перевірки.
- Знижено ризик релізної невизначеності: є відтворюваний локальний шлях валідації Firestore-функціоналу через emulator.
