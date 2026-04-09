# 2026-04-09-31 Runtime Observability Hygiene

## Як було

- У runtime-шляхах backend ще залишалися сирі `console.error/console.warn` у роутерах auth, health і security.
- CSP telemetry endpoint не отримував стабільну кореляцію по `requestId` у всіх сценаріях middleware-порядку.
- У pre-release gate не було окремого guard, який блокує повернення сирих console-викликів у runtime API код.

## Що зроблено

- Замінено сирі console-виклики у runtime роутерах на структурований `logger`:
  - `auth.login.failed` у login error-path.
  - `health.db.check_failed` у DB health error-path.
  - `security.csp.violation` та `security.csp.violation_unparsed` у CSP report endpoint.
- В `server` переставлено middleware так, щоб `requestLoggingMiddleware` виконувався до `securityRoutes`.
- Розширено CSP payload parser: підтримка string, object і array payload, щоб endpoint залишався сумісним незалежно від pre-parsing.
- Додано helper self-test `scripts/test-runtime-console-usage.mjs` для контролю відсутності `console.log/warn/error` у `backend/src/server.js` та `backend/src/routes/**`.
- Інтегровано новий helper у локальний pre-release gate та CI workflow.
- Оновлено документацію gate в `README` і `RELEASE_RUNBOOK`.

## Що покращило/виправило/додало

- Runtime-логи backend стали консистентно структурованими, з єдиною санітизацією через logger.
- Кореляція інцидентів для CSP telemetry покращилась завдяки стабільному `requestId`.
- Ризик повторної появи сирих runtime console-викликів знижено через окремий fail-fast helper у local/CI gate.
