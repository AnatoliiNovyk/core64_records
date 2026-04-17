# 2026-04-17-24 Pre Release Gate Skip Auth Rate Limit Probe Ci

## Як було

- Після перенесення `Run API error contract check` перед `Run smoke-check` verifier міг активувати auth lockout probe.
- Це створювало побічний ефект для наступного `smoke-check`: логін міг падати через тимчасовий `AUTH_RATE_LIMITED` lockout, хоча основний API-контракт уже був валідним.

## Що зроблено

- У `.github/workflows/pre-release-gate.yml` для кроку `Run API error contract check` додано env:
- `CORE64_CONTRACT_SKIP_AUTH_RATE_LIMIT_CHECK="true"`.
- Решта API error contract перевірок (401/400/404 shape, observer `/health/db`, тощо) залишені активними.

## Що покращило/виправило/додало

- Прибрано побічний lockout-ефект між послідовними кроками gate.
- `Run smoke-check` більше не падає через штучно створене rate-limit навантаження попереднього кроку.
- Підвищено стабільність CI pre-release контуру без відключення основних контрактних перевірок.
