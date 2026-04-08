# 2026-04-09-05 Smoke Check CSP Telemetry Verification

## Як було

- `scripts/smoke-check.mjs` перевіряв health/db/public/admin/contact, але не перевіряв наявність CSP/security headers.
- Smoke-check не валідував роботу `POST /api/security/csp-report`, тому telemetry endpoint міг зламатися непомітно.
- Через це CSP hardening мав окремі ad-hoc перевірки замість автоматизованого контракту в основному smoke сценарії.

## Що зроблено

- У `scripts/smoke-check.mjs` додано перевірку security headers на `GET /api/health`:
  - `X-Content-Type-Options` (`nosniff`),
  - `X-Frame-Options` (`DENY`),
  - `Referrer-Policy` (`no-referrer`),
  - наявність CSP header (`Content-Security-Policy` або `Content-Security-Policy-Report-Only`),
  - наявність `report-uri` у активному CSP header.
- Додано детальну секцію `checks.health.securityHeaders` у JSON-звіт smoke-check:
  - `csp`, `cspReportOnly`, `cspModeDetected`, `cspReportUriPresent`.
- Додано пробний інтеграційний POST у `POST /api/security/csp-report` з test payload:
  - у звіт додаються `cspReportEndpointStatus` і `cspReportEndpointOk`;
  - при неуспішній відповіді smoke-check фейлиться.
- Проведено перевірки після змін:
  - `node scripts/smoke-check.mjs` — passed;
  - `npm run contract-check:settings-public` — passed;
  - `npm run ui-smoke` — passed.

## Що покращило/виправило/додало

- CSP telemetry і базові security headers тепер покриті в основному smoke-контракті проєкту.
- Регресії у CSP-заголовках або endpoint збору звітів виявляються автоматично до релізу.
- Зменшено ризик "тихого" падіння security hardening між змінами backend middleware/routes.
- Підвищено діагностичність smoke-звіту для безпекового контуру.
