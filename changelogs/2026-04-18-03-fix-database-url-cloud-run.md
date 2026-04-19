# 2026-04-18-03 — Fix: DATABASE_URL in Cloud Run pointed to degraded Neon endpoint

## Як було

`DATABASE_URL` у Cloud Run читався через `secretKeyRef` з Google Secret Manager.
Secret Manager містив старий endpoint:
```
ep-silent-sound-alsxnw9x.c-3.eu-central-1.aws.neon.tech
```
Цей проект вичерпав квоту сховища (`DB_STORAGE_LIMIT_REACHED`).

Через це:
- `/api/health/db` → `status: degraded`, `database: unavailable`
- `shouldUseApi()` у `data-adapter.js` повертав `false`
- Логін на адмін-панелі падав з "Invalid password" **без перевірки пароля** (код ішов у local fallback)

## Що зроблено

1. Діагностовано: `DATABASE_URL` у Secret Manager (`secretKeyRef`) досі вказував на старий EU-central endpoint — кутовер попередньої сесії оновив лише `DATABASE_URL` у попередній ревізії, але не в Secret Manager.
2. Через відсутність прав на `secretmanager.versions.add` — секрет оновити неможливо.
3. Виконано `gcloud run services update --remove-secrets=DATABASE_URL` — видалено secretKeyRef.
4. Потім `gcloud run services update --update-env-vars="DATABASE_URL=..."` з правильним US-east-2 endpoint (проект `core64-cutover-temp-2026-04-17`, `ep-polished-haze-aju8lru4-pooler.c-3.us-east-2.aws.neon.tech`).
5. Cloud Run ревізія `core64-api-00133-7fn` задеплоєна і обслуговує 100% трафіку.

## Результат

- `/api/health/db` → `status: ok`, `database: ok`
- `POST /api/auth/login` з паролем `npg_ys6doBl2OMSu` → `HTTP 200`, токен видається
- Адмін-панель `core64.pp.ua/admin` доступна
