# 2026-04-09-02 UI Smoke Determinism And Security Hardening

## Як було

- `scripts/ui-smoke.mjs` мав жорстко зашитий очікуваний порядок секцій (`events,releases,artists`), через що тест падав false-negative, коли фактичний порядок після мутації відрізнявся, але лишався валідним.
- У backend не було базового шару security headers для HTTP-відповідей.
- Для критичних endpoint (`/api/auth/login`, `/api/contact-requests`) не було прикладного rate-limit захисту від brute-force/abuse.

## Що зроблено

- У `scripts/ui-smoke.mjs` перевірку порядку секцій зроблено data-driven:
  - очікуваний порядок тепер обчислюється з `mutatedSections`, а не хардкодиться;
  - перевірка desktop/mobile nav префіксів прив'язана до цього ж динамічного очікування.
- Додано `backend/src/middleware/security.js`:
  - `applySecurityHeaders` додає `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy` (+ `Strict-Transport-Security` у production);
  - `createRateLimiter` реалізує in-memory rate-limit з `Retry-After` і кодом 429.
- У `backend/src/server.js` підключено middleware security headers для всіх запитів.
- У `backend/src/config.js` додано нові параметри з валідацією:
  - `AUTH_RATE_LIMIT_WINDOW_MS`, `AUTH_RATE_LIMIT_MAX`;
  - `CONTACT_RATE_LIMIT_WINDOW_MS`, `CONTACT_RATE_LIMIT_MAX`.
- У `backend/src/routes/auth.js` додано rate-limit для `/auth/login`.
- У `backend/src/routes/contactRequests.js` додано rate-limit для `POST /contact-requests`.
- Проведено тести:
  - diagnostics для змінених файлів — без помилок;
  - `node scripts/smoke-check.mjs` — passed;
  - `npm run ui-smoke` — passed після виправлення детермінізму;
  - негативні тести rate-limit: для login та contact endpoint підтверджено перехід на 429 після перевищення ліміту.

## Що покращило/виправило/додало

- Прибрано false-negative у UI smoke тестах для порядку секцій, тест став стабільнішим і ближчим до реальної бізнес-логіки.
- Підсилено базову безпеку HTTP-відповідей через стандартні security headers.
- Додано прикладний anti-abuse захист для двох найбільш чутливих endpoint.
- Підвищено керованість hardening через env-параметри rate-limit без змін коду під різні середовища.
