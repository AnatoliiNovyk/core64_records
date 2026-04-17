# 2026-04-17-20 Audit Logs Structured Diff For Contract Check

## Як було

- Endpoint `GET /api/audit-logs` повертав лише compact summary у полі `details`.
- Для записів `settings_updated` у відповіді бракувало повної структури `details.diff.settings` (`changedFields`, `changes`).
- Через це контрактний скрипт `scripts/settings-public-contract-check.mjs` падав із помилкою про відсутній/некоректний audit diff після `PUT /settings`.

## Що зроблено

- У `backend/src/db/repository.js` (функція `listAuditLogs`) змінено побудову поля `details` для обʼєктних записів audit:
- Залишено summary-поля (`source`, `hasDiff`, лічильники змін).
- Додано повернення повного `details.diff`, коли він присутній у записі.
- Для цього сценарію позначено `isCompact=false`, щоб явно відрізняти від fallback-випадків (`details IS NULL` або не-обʼєкт).

## Що покращило/виправило/додало

- Відновлено сумісність API audit-логів із контрактною перевіркою settings/public.
- `settings-public-contract-check` знову може валідувати структурований diff (`changedFields`, `changedCount`, `changes`) без втрати існуючих summary-полів.
- Знижено ризик false-negative падінь pre-release gate на кроці перевірки audit diff.
