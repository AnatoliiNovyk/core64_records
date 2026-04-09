# 2026-04-09-35 Local CI Gate Parity Stabilization

## Як було

- CI pre-release gate не виконував окремий крок `settings i18n consistency check`, хоча локальний gate його запускав.
- У local gate `settings/public contract check` викликався напряму через `node`, тоді як у CI використовувався npm-script entrypoint.
- Документація неявно описувала різницю між local і CI pre-release поведінкою щодо UI smoke.

## Що зроблено

- Додано в CI workflow новий крок `Run settings i18n consistency check` з коректними env-параметрами (`CORE64_API_BASE`, `CORE64_ADMIN_PASSWORD`, `CORE64_CONSISTENCY_TIMEOUT_MS`).
- У local pre-release gate уніфіковано виклик `settings/public contract check` через `npm run contract-check:settings-public` для паритету з CI.
- Оновлено `README` та `RELEASE_RUNBOOK`:
  - зафіксовано, що i18n consistency check виконується як частина gate-потоку;
  - явно задокументовано, що UI smoke у pre-release default залишається CI-only.

## Що покращило/виправило/додало

- Зменшено drift між local і CI gate для контрактних перевірок налаштувань.
- Спрощено підтримку scripts invocation завдяки єдиному npm entrypoint для settings/public contract.
- Покращено прозорість release-процесу через явне документування CI-only UI smoke policy.
