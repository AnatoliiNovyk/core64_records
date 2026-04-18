# Changelog 2026-04-18 #01 - Production DB cutover for core64-api

## Як було

- Production домен `https://core64.pp.ua` віддавав фронтенд, але API-контур був деградований через БД:
- `GET /api/health` -> `200`;
- `GET /api/health/db` -> `503` з `DB_STORAGE_LIMIT_REACHED`;
- `GET /api/public?lang=en` -> `507`.
- Через це публічний frontend виглядав "мертвим", а вхід в адмінку давав невалідну поведінку (неможливість стабільного login flow через недоступний data backend).

## Що зроблено

- Проведено runtime cutover для `core64-api` у Cloud Run:
- джерело `DATABASE_URL` на сервісі `core64-api` переведено з Secret Manager reference на той самий робочий literal `DATABASE_URL`, який уже використовував `core64-api-temp`.
- Збережено поточні secret references для `JWT_SECRET` та `ADMIN_PASSWORD` без зміни їхніх значень.
- Виконано post-fix перевірку проти production-домену:
- health/public probes;
- `auth/login` + `auth/me`;
- `smoke-check.mjs`;
- `contract-check:settings-public`;
- `consistency-check:settings-i18n`.

## Що покращило/виправило/додало

- Відновлено доступність production API data-path для фронтенду:
- `GET /api/health/db` -> `200`;
- `GET /api/public?lang=en` -> `200`.
- Відновлено працездатність admin auth-path:
- `POST /api/auth/login` -> `200` (token issued);
- `GET /api/auth/me` -> `200`.
- Підтверджено стабільність після cutover через smoke + contract + i18n consistency перевірки на production-домені.
