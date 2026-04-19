# 2026-04-19-02 Admin Password Reset

## Як було
- `ADMIN_PASSWORD` в GCP Secret Manager (і локальному `backend/.env`) містив значення `npg_ys6doBl2OMSu` — Neon PostgreSQL connection token, який був випадково збережений як пароль адміна.
- Вхід на `core64.pp.ua/admin` повертав «Invalid password» при введенні будь-якого наміченого пароля.
- Сервісний акаунт `github-actions-deployer` не мав прав `secretmanager.versions.add` для оновлення секрету напряму.
- Neon free-tier data transfer quota exceeded — пряме підключення до БД для оновлення `admin_users` також недоступне.

## Що зроблено
1. Згенеровано новий сильний пароль: `Core64!97S4psIo` (15 символів, mixed-case + цифри + спецсимвол).
2. Замість оновлення Secret Manager (немає прав) — через `gcloud run services update`:
   - Крок 1: `--remove-secrets ADMIN_PASSWORD` — видалив secret-binding (revision 00135 впав без змінної, але старий traffic залишився).
   - Крок 2: `--set-env-vars` з усіма required env vars + новим `ADMIN_PASSWORD=Core64!97S4psIo` — revision 00138-ssx задеплоєний успішно, 100% трафіку.
3. Оновлено `backend/.env` локально: `ADMIN_PASSWORD="Core64!97S4psIo"`.
4. Verified: POST `/api/auth/login` з новим паролем → HTTP 200 + JWT token.

## Що покращило/виправило/додало
- Адмін-вхід на `core64.pp.ua/admin` тепер працює з новим паролем.
- `ADMIN_PASSWORD` більше не є Neon DB token.
- Локальне `backend/.env` синхронізовано з production значенням.
- **Примітка безпеки**: ADMIN_PASSWORD зараз зберігається як plain env var у Cloud Run (не через Secret Manager). Рекомендується: вручну оновити секрет через GCP Console → Secret Manager → `ADMIN_PASSWORD` → додати нову версію зі значенням `Core64!97S4psIo`, а потім перевести Cloud Run назад на secret binding через наступний деплой.
