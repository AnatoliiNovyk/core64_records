## Як було
- У локальному `pre-release-gate` кроці перевірки API error contract не було керованих параметрів retry/cooldown.
- При транзієнтних збоях (`fetch failed`, короткочасний `429`) прогін міг падати без повторної спроби.
- Документація локальних override-параметрів не покривала керування retries/delay для контрактного кроку.

## Що зроблено
- У `scripts/pre-release-gate-local.ps1` додано параметри:
  - `Core64ContractRetries` (default `3`)
  - `Core64ContractRetryDelayMs` (default `2000`)
- Додано helper `Invoke-ApiErrorContractCheck` для уніфікованого запуску `verify-api-error-contract` з capture виводу.
- У кроці `[18/22]` реалізовано:
  - fallback `localhost -> 127.0.0.1` при `fetch failed`
  - retry-loop для транзієнтних `AUTH_RATE_LIMITED`/`429` і `fetch failed`
  - збереження існуючого override `Core64ContractSkipAuthRateLimitCheck`.
- Оновлено документацію в `README.md` і `RELEASE_RUNBOOK.md` для нових параметрів retry/cooldown.

## Що покращило/виправило/додало
- Зменшено flaky-падіння local gate у dev/tokenless режимі через короткочасні мережеві або rate-limit збої.
- Додано керованість поведінки контрактного кроку без послаблення strict default режиму.
- Підвищено передбачуваність локальних перевірок перед релізом завдяки документованим параметрам і стабільнішому сценарію retry.
