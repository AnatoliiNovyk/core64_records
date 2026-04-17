# 2026-04-17-10 Production Contract Verification and Deploy Permission Block

## Як було

- Після локального hardening потрібно було перейти до production-етапу: задеплоїти оновлений image і перевірити нові контракти помилок для DB quota/storage-limit.
- Не було підтвердження, чи production вже віддає нові коди (`DB_STORAGE_LIMIT_REACHED`, `AUTH_DB_STORAGE_LIMIT_REACHED`) на критичних endpoint-ах.

## Що зроблено

- Спробовано виконати production deploy з локального середовища:
- `docker build/push` не вдалося через відсутність Docker CLI/daemon у поточному середовищі.
- fallback через `gcloud builds submit`/source deploy заблоковано правами service account (недостатні IAM permissions для Cloud Build/source deploy).
- Виконано повний read-only production baseline probes проти `core64-api`:
- `GET /api/health` -> `200` (`status=ok`).
- `GET /api/health/db` -> `503` з `code=DB_STORAGE_LIMIT_REACHED`.
- `GET /api/public` -> `507` з `code=DB_STORAGE_LIMIT_REACHED`.
- `POST /api/auth/login` (wrong password) -> `503` з `code=AUTH_DB_STORAGE_LIMIT_REACHED`.
- Виконано `health`-mode smoke проти production:
- `passed=false`;
- `health=200`, `health/db=503`, причина: `DB_STORAGE_LIMIT_REACHED`.

## Що покращило/виправило/додало

- Підтверджено на живому production, що новий контракт storage-limit помилок уже активний і повертає діагностичні коди замість неінформативного generic фейлу.
- Зафіксовано реальний блокер для подальших runtime-операцій деплою з поточного оточення: відсутність Docker та недостатні IAM права на Cloud Build/source deploy.
- Оновлено операційний baseline для наступного кроку: після відновлення DB quota достатньо повторити prod smoke (health/full) без додаткової діагностики контрактів.
