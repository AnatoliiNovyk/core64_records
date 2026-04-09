# 2026-04-09-29 API Error Contract Helper and Gate

## Як було

- Формат API помилок у backend був частково неоднорідним між middleware та route-модулями.
- Деякі відповіді мали лише `error`, частина мала `code + error`, але без уніфікованого `status` у payload.
- У pre-release gate не було окремого контрактного кроку, який перевіряє error-shape для ключових негативних сценаріїв (401/400/404).

## Що зроблено

- Додано централізований helper `backend/src/utils/apiError.js`:
  - `buildApiErrorPayload`, `sendApiError`, `sendValidationError`, `fromZodError`.
- Підключено helper у backend:
  - `backend/src/server.js` — уніфікований global error middleware для Zod/DB/500;
  - `backend/src/middleware/auth.js` — 401 відповіді з `status + code + error`;
  - `backend/src/middleware/validate.js` — 400 validation через `sendValidationError`;
  - `backend/src/middleware/security.js` — 429 rate-limit payload доповнено `status`;
  - `backend/src/routes/auth.js` — уніфіковано AUTH error responses;
  - `backend/src/routes/collections.js` — 404 not found через helper (`COLLECTION_ITEM_NOT_FOUND`);
  - `backend/src/routes/contactRequests.js` — captcha validation 400 через helper і 404 not found через helper.
- Додано новий контрактний verifier `scripts/verify-api-error-contract.mjs` для сценаріїв:
  - auth required 401,
  - settings validation 400,
  - API route-not-found 404.
- Інтегровано verifier у gate:
  - local: `scripts/pre-release-gate-local.ps1` (новий крок `Running API error contract check...`);
  - CI: `.github/workflows/pre-release-gate.yml` (крок `Run API error contract check`).
- Оновлено `RELEASE_RUNBOOK.md` з обов'язковою вимогою API error contract check.

## Що покращило/виправило/додало

- Error-контракт backend став більш консистентним і передбачуваним для негативних сценаріїв.
- Знижено ризик дрейфу error-shape між route-модулями та middleware.
- Release gate тепер автоматично валідує ключові API error-контракти до проходження релізу.
