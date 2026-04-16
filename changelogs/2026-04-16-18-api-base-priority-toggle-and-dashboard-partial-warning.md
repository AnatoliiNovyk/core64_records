# API Base Priority Toggle And Dashboard Partial Warning

## Як було

- Після hardening `data-adapter.js` пріоритет API base став жорстко конфігураційним, що могло ламати очікувані сценарії ручного persistent override через localStorage.
- У Dashboard при частковому збої (коли `settings` недоступні, але колекції завантажились) не було явного попередження для оператора.
- Через кеш браузера нова логіка могла підхоплюватися не відразу.

## Що зроблено

- У `data-adapter.js` додано конфіг-прапорець `preferStoredApiBase`:
  - якщо `true`, same-origin stored API base має пріоритет над конфігом сторінки;
  - якщо `false` (дефолт у поточному конфігу), працює безпечний конфіг-first сценарій;
  - cross-origin stored base і далі очищується автоматично.
- У `admin.js` додано явний warning для Dashboard при частковому оновленні:
  - якщо `settings` не завантажились, але базові колекції оновились, показується інформаційний статус;
  - додано переклади для UK/EN (`dashboardPartialSettingsWarning`).
- У `index.html` і `admin.html` додано `preferStoredApiBase: false` у `CORE64_CONFIG`.
- Піднято cache-busting версії скриптів:
  - `index.html`: `data-adapter.js?v=2026-04-16-18`, `app.js?v=2026-04-16-18`;
  - `admin.html`: `data-adapter.js?v=2026-04-16-18`, `admin.js?v=2026-04-16-18`.

## Що покращило/виправило/додало

- Усунуто регресійний ризик для сценаріїв ручного керування API base (через явний toggle).
- Адмінка тепер не маскує частковий збій `settings` на Dashboard.
- Нові клієнтські зміни гарантовано підтягуються після оновлення сторінки завдяки новим cache-busting версіям.
