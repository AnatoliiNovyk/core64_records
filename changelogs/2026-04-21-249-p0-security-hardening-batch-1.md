# 2026-04-21-249 P0 Security Hardening Batch 1

## Як було

- Data adapter приймав apiBaseUrl/api з query-параметрів без origin allowlist і міг зберігати сторонній API base у localStorage.
- Backend приймав JSON payload до 120mb, що підвищувало ризик memory pressure на Cloud Run.
- Перевірка captcha provider не мала локального timeout/abort і могла зависати на зовнішньому виклику.
- requireAuth перевіряв лише підпис JWT, без жорсткої перевірки обов'язкового subject claim.

## Що зроблено

- У data-adapter додано allowlist-перевірку API base кандидатів (query/stored/runtime), безпечну обробку configured base і вимкнений query override за замовчуванням поза localhost.
- У frontend config (public/admin) додано `allowQueryApiBaseOverride` та `apiBaseOverrideAllowlist` з безпечними дефолтами.
- У backend/server зменшено `express.json` limit з 120mb до 25mb.
- У backend/services/captcha додано timeout 10s через AbortController і явну обробку timeout як `errorCodes: ["timeout"]`.
- У backend/middleware/auth додано перевірку `sub === "env-admin"` перед допуском до захищених endpoint.

## Що покращило/виправило/додало

- Зменшено ризик витоку admin credentials/token через підставний API endpoint у query параметрах.
- Знижено DoS-поверхню від надвеликих JSON payload і ризик OOM під конкурентним навантаженням.
- Підвищено стабільність captcha-flow при мережевих затримках зовнішнього провайдера.
- Підсилено auth gate для API: токен тепер має не лише валідний підпис, а й очікуваний subject.
