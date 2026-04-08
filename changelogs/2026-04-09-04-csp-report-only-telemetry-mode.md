# 2026-04-09-04 CSP Report Only Telemetry Mode

## Як було

- CSP працював лише у режимі enforce без керованого перемикання між режимами.
- Не було окремого API endpoint для прийому CSP violation reports від браузера.
- Не було env-керування для telemetry сценарію (`report-only` або `both`).
- Документація не описувала режими CSP та шлях збору violation report payloads.

## Що зроблено

- У `backend/src/config.js` додано нові конфіг-поля:
  - `CSP_MODE` з валідними значеннями `enforce | report-only | both`;
  - `CSP_REPORT_URI` (relative path або absolute URL) з валідацією.
- У `backend/src/middleware/security.js` CSP логіку зроблено mode-aware:
  - для `enforce`/`both` повертається `Content-Security-Policy`;
  - для `report-only`/`both` повертається `Content-Security-Policy-Report-Only`;
  - до policy додається `report-uri` на основі `CSP_REPORT_URI`.
- Додано новий route `backend/src/routes/security.js`:
  - `POST /api/security/csp-report` приймає звіти CSP;
  - підтримує legacy `csp-report` і payloads Reporting API;
  - відповідає `204` і логує безпечне зведення для діагностики.
- У `backend/src/server.js` підключено `securityRoutes` під `/api` до глобального JSON parser.
- У `backend/.env.example` додано нові env-змінні `CSP_MODE` і `CSP_REPORT_URI`.
- У `README.md` додано секцію про CSP режими та telemetry endpoint.
- Виконано runtime перевірки:
  - `GET /api/health` показує CSP header із `report-uri`;
  - `POST /api/security/csp-report` повертає `204`;
  - `npm run contract-check:settings-public` — passed;
  - `node scripts/smoke-check.mjs` — passed;
  - `npm run ui-smoke` — passed.

## Що покращило/виправило/додало

- З'явився контрольований безпечний перехід до CSP telemetry без ризику зламати поточний frontend runtime.
- Додано канал збору CSP-порушень для подальшого жорсткішого hardening на основі фактичних даних.
- Налаштування CSP стали керованими через env без зміни коду під кожне середовище.
- Підвищено прозорість експлуатації завдяки документації та валідації конфігурації на старті.
