# Changelog 2026-04-17 #26 - UI smoke auth session refresh guard

## Як було

- `scripts/ui-smoke.mjs` переходив до `loadSettings/saveSettings` після UI-логіну без жорсткої перевірки валідності токена через `/auth/me`.
- У CI це давало флейковий сценарій: крок `Run UI smoke` падав на `Unauthorized` під час `applyMutationViaUi`.

## Що зроблено

- У `scripts/ui-smoke.mjs` додано `requestAdminToken(adminPassword)` для явного отримання токена через `POST /auth/login`.
- Додано `persistAdminSessionToken(page, token)` для примусового запису токена в `sessionStorage` (`core64_admin_token`, `core64_admin_auth`).
- Посилено `ensureAdminLoggedIn`:
- після приховання login screen тепер обов’язково перевіряється наявність токена;
- якщо токен відсутній, виконується API-логін і запис токена в сесію;
- далі виконується `GET /auth/me`; при невдачі робиться один session refresh (новий токен + reload сторінки) і повторна перевірка.

## Що покращило/виправило/додало

- Додано fail-fast/repair-механізм для нестабільної сесії перед операціями з settings у UI smoke.
- Знижено ризик падіння `Run UI smoke` через проміжний стан авторизації.
- Логи помилок при auth-проблемах стали більш діагностичними (`POST /auth/login (ui smoke)`, `GET /auth/me after session refresh`).
