# 218 — feat(deploy): add Firestore backend support to deploy workflow

## Як було
Deploy workflow `deploy-google-run.yml` підтримував лише `DATA_BACKEND=postgres`. Він завжди:
- Вимагав наявності секрету `DATABASE_URL` в Secret Manager
- Читав та валідував `DATABASE_URL` перед кожним деплоєм
- Биндив `DATABASE_URL` як секрет на Cloud Run
- Робив pre-smoke DB route compatibility check через Postgres

При переключенні на Firestore workflow падав ще до деплою (відсутній/квотований `DATABASE_URL`).

## Що зроблено
- Додано два нових workflow inputs:
  - `data_backend` (choice: postgres|dual|firestore, default: postgres)
  - `firestore_project_id` (string, default: core64records)
- У "Validate deploy inputs": перевірка що `firestore_project_id` заповнений коли `firestore|dual`
- У "Validate GCP resources and secrets": пропуск перевірки секрету `DATABASE_URL` коли `data_backend=firestore`
- У "Validate runtime config from secrets": умовне завантаження `DATABASE_URL`, обгортка всіх DB policy checks у `if [ "$DATA_BACKEND" != "firestore" ]`, export `DATA_BACKEND` та `FIRESTORE_PROJECT_ID` для `validateConfig()`
- У "Deploy to Cloud Run": `DATA_BACKEND` і `FIRESTORE_PROJECT_ID` додані до `--set-env-vars`; `DATABASE_URL` прибраний з `--set-secrets` коли firestore
- У "Post-deploy smoke check": пропуск DB route compatibility check коли firestore
- У "Collect diagnostics": умовне завантаження `DATABASE_URL` коли firestore

## Результат
Workflow тепер підтримує деплой у режимі Firestore без PostgreSQL залежності. Можна запускати з `data_backend=firestore, firestore_project_id=core64records` щоб мігрувати production з Neon на Firestore. Залишається виконати:
1. Надати SA `github-actions-deployer@core64records.iam.gserviceaccount.com` роль `roles/datastore.user` через GCP Console
2. Задиспатчити deploy workflow з `data_backend=firestore`
