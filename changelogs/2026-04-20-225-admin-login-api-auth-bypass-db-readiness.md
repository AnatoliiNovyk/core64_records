## Як було
- В адмінці міг з’являтися `Invalid password`, навіть коли `POST /api/auth/login` з тим самим паролем повертав 200.
- Причина: у `data-adapter.js` логін у режимі `api` залежав від `shouldUseApi()`, а той падав у `false`, якщо `/health/db` повертав 503.
- Після цього код переходив у гілку `AUTH_INVALID_CREDENTIALS` і показував хибну помилку пароля.

## Що зроблено
- У `data-adapter.js` переписано auth-flow для режиму `api`:
  - `login(password)` тепер спочатку напряму викликає `/auth/login`, без блокування через `shouldUseApi()`;
  - `isAuthenticated()` у `api`-режимі напряму перевіряє `/auth/me`.
- Offline fallback залишено лише для дозволених випадків (`allowOfflineAdminAccess=true`) та мережевих/route/db-unavailable помилок.
- При реальних помилках аутентифікації більше не підміняється код на `AUTH_INVALID_CREDENTIALS` через readiness-gate.

## Що покращило / виправило / додало
- Усунуто хибний цикл «правильний пароль -> Invalid password».
- Логін в адмінку тепер спирається на реальний результат auth endpoint, а не на стан `/health/db`.
- Поведінка auth стала стабільнішою в деградованих сценаріях health/db.
