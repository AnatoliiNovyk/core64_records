# Readiness Probe Timeout Unblock Bootstrap

## Як було

- Адаптер перевіряв `/health/db` із загальним timeout запиту (до 15с+), тому при проблемній БД bootstrap адмінки/фронтенду міг довго блокуватися.
- Через цю затримку login-екран адмінки міг не встигати сховатися до smoke timeout, навіть коли adapter вже переходив у local fallback.

## Що зроблено

- У `data-adapter.js` додано короткий timeout для readiness probe:
  - `API_READINESS_PROBE_TIMEOUT_MS = 2500`;
  - `/health` і `/health/db` у `evaluateApiReadiness()` виконуються з коротким signal timeout.
- При спрацьовуванні timeout readiness швидко повертає `false` і adapter переходить у local fallback без довгого блокування bootstrap.
- Піднято cache-busting версії:
  - `index.html`: `data-adapter.js?v=2026-04-16-23`, `app.js?v=2026-04-16-23`;
  - `admin.html`: `data-adapter.js?v=2026-04-16-23`, `admin.js?v=2026-04-16-23`.

## Що покращило/виправило/додало

- При недоступній БД сторінки деградують швидко, без багатосекундного «зависання» на readiness-перевірці.
- Адмін bootstrap більше не блокується довгими health/db timeout перед переходом у fallback.
- Зменшено ризик timeout-падінь у UI smoke на етапі авторизаційного bootstrap.
