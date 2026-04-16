# Offline Admin Access When DB Is Unavailable

## Як було

- Після переходу adapter у local fallback при `DB_UNAVAILABLE` адмінка могла залишатись заблокованою login-екраном у режимі `dataMode: api`.
- Тобто деградація даних працювала, але UX авторизації не давав увійти в адмінку без робочої БД.

## Що зроблено

- У `data-adapter.js` додано керований прапорець `allowOfflineAdminAccess` (дефолт: `true`).
- Для `login()`:
  - якщо API недоступний на рівні readiness (`shouldUseApi() === false`) і активний `dataMode: api`, adapter дозволяє офлайн-сесію в admin (ставить `core64_admin_auth=true`).
- Для `isAuthenticated()`:
  - у тому ж деградованому сценарії повертає `true`, щоб не блокувати адмінку login-екраном.
- У `index.html` та `admin.html` додано `allowOfflineAdminAccess: true` до `CORE64_CONFIG`.
- Піднято cache-busting версії:
  - `index.html`: `data-adapter.js?v=2026-04-16-21`, `app.js?v=2026-04-16-21`;
  - `admin.html`: `data-adapter.js?v=2026-04-16-21`, `admin.js?v=2026-04-16-21`.

## Що покращило/виправило/додало

- Адмінка більше не «мертва» в сценарії «API живий, БД недоступна».
- Оператор отримує доступ до інтерфейсу навіть у деградованому режимі.
- Поведінка контрольована конфігом і може бути вимкнена (`allowOfflineAdminAccess: false`).
