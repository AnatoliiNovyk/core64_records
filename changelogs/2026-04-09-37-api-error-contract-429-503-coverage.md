# 2026-04-09-37 API Error Contract 429/503 Coverage

## Як було

- Після попереднього non-flaky батчу `verify-api-error-contract` покривав стабільні 401/400/404 сценарії, але не перевіряв runtime-контракт rate-limit помилок `429`.
- Для `503 DB_UNAVAILABLE` не було безфлейкового механізму runtime-перевірки: у healthy середовищах примусова перевірка 503 могла створювати нестабільність gate.
- Self-test `test-verify-api-error-contract` не мав детермінованих кейсів для `AUTH_RATE_LIMITED` і observer-поведінки `health/db`.

## Що зроблено

- Розширено `scripts/verify-api-error-contract.mjs`:
  - додано runtime-check `authRateLimited` з контрольованим циклом login-спроб;
  - перевіряється строгий shape для `429 AUTH_RATE_LIMITED` включно з `Retry-After >= 1`;
  - додано env knobs:
    - `CORE64_CONTRACT_AUTH_RATE_LIMIT_ATTEMPTS` (кількість спроб, default 12),
    - `CORE64_CONTRACT_SKIP_AUTH_RATE_LIMIT_CHECK` (emergency skip, default false);
  - додано observer-check `dbUnavailable` для `GET /health/db`:
    - якщо `503` — строга перевірка контракту `DB_UNAVAILABLE` (`status=degraded`, `database=unavailable`, `details.kind`, `details.target`, timeout/duration полів);
    - якщо `200` — check позначається як `skipped` з `ok=true`, без фейлу verifier.
- Розширено `scripts/test-verify-api-error-contract.mjs`:
  - mock server тепер емулює `/api/health/db` у режимах healthy/degraded;
  - додано детермінований `AUTH_RATE_LIMITED` шлях у mock login із `retry-after` header;
  - додано позитивні перевірки для `authRateLimited` і `dbUnavailable`;
  - додано негативні кейси `auth-rate-limit-mismatch` і `db-unavailable-details-missing`.

## Що покращило/виправило/додало

- Закрито coverage-gap для критичного runtime-контракту `429` без змін backend бізнес-логіки.
- Додано безфлейкову модель перевірки `503`: контракт валідyється строго при реальній деградації, але healthy середовище не ламає gate.
- Підвищено надійність pre-release перевірок завдяки deterministic self-test сценаріям для 429/503.
- Збережено backward-compatible і стабільний шлях для local/CI gate без обовʼязкових змін orchestration.
