# 2026-04-16-24 Strict API No Demo Fallback

## Як було

- При деградації БД frontend/admin могли переходити на local fallback і показувати демо-дані з `DEFAULT_DATA`, що виглядало як "чужі" записи.
- Публічна сторінка з `requireApiOnPublic=true` все одно могла рендерити fallback-набір після перевірок доступності.
- В адмінці за API-режиму був можливий офлайн/локальний auth fallback, що дозволяло зайти без реального API токена.
- Під час проблем із БД відчувався повільний старт через часті readiness-перевірки.

## Що зроблено

- У `data-adapter.js` посилено strict API-поведінку:
  - `isApiAvailable()` переведено на DB-aware readiness через `shouldUseApi()`.
  - В API/auto режимах припинено автозасів демо-даними при порожньому localStorage.
  - `ensureLocalDefaults()` тепер ініціалізує demo local data лише для `dataMode="local"`.
  - Для `login()`/`isAuthenticated()` в `dataMode="api"` при `allowOfflineAdminAccess=false` вимкнено локальний auth fallback.
  - Оптимізовано readiness: `API_READINESS_CACHE_TTL_MS` збільшено до 30000, `API_READINESS_PROBE_TIMEOUT_MS` зменшено до 1200.
- У `app.js` в `bootstrap()` додано ранню перевірку API readiness при `requireApiOnPublic=true`; за неготовності API показується статус, а не fallback-дані.
- У `index.html` та `admin.html` встановлено `allowOfflineAdminAccess: false`.
- Оновлено cache-busting версії скриптів до `v=2026-04-16-24`.

## Що покращило/виправило/додало

- При недоступній БД сайт більше не підміняє ваш контент демо-набором у критичних API-сценаріях.
- Адмінка не авторизує локально в режимі strict API, що прибирає "фальшивий онлайн" і не дає працювати з неактуальними fallback-даними.
- Публічний bootstrap раніше і прозоріше показує стан недоступності API, замість тихого рендеру неваших даних.
- Зменшено затримки повторних readiness-перевірок завдяки довшому кешу та коротшому probe-timeout.
