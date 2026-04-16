# API Base Source Stability And Public Strict Mode

## Як було

- `data-adapter.js` надавав пріоритет збереженому `core64_api_base_url` з localStorage над конфігом сторінки.
- Якщо у браузері лишався старий/чужий API base, і адмінка, і публічна сторінка могли тягнути дані не з того джерела або переходити в порожній fallback-сценарій.
- На публічному сайті було `requireApiOnPublic: false`, тому при проблемах API сторінка могла виглядати «живою», але фактично бути порожньою по даних.

## Що зроблено

- У `data-adapter.js` змінено порядок вибору API base:
  - query override зберігається і застосовується відразу;
  - далі пріоритет має явний `window.CORE64_CONFIG.apiBaseUrl`;
  - збережений base з localStorage використовується лише як fallback і тільки якщо він same-origin;
  - cross-origin збережений base автоматично очищається.
- Додано допоміжні функції перевірки same-origin для API base і безпечного очищення збереженого override.
- У `index.html` встановлено `requireApiOnPublic: true`.
- Додано cache-busting для підключення скриптів:
  - `index.html`: `data-adapter.js?v=2026-04-16-17`, `app.js?v=2026-04-16-17`;
  - `admin.html`: `data-adapter.js?v=2026-04-16-17`.

## Що покращило/виправило/додало

- Зменшено ризик «тихого» підключення до неправильного API через старий localStorage override.
- Публічний фронтенд більше не маскує API-збій порожнім контентом.
- Новий adapter-код гарантовано підтягується одразу після оновлення сторінки завдяки cache-busting.
