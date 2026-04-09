# 2026-04-09-32 Critical Gate Helper Coverage

## Як було

- У pre-release gate були обовʼязкові перевірки API error contract та settings i18n consistency, але для їхніх helper-скриптів не існувало ізольованих self-tests.
- Регресія в логіці verifier/checker могла залишитися непоміченою до запуску живого smoke-контурy.
- Coverage helper-шару для gate-critical скриптів був неповним у local та CI.

## Що зроблено

- Додано self-test `scripts/test-verify-api-error-contract.mjs` з локальним mock HTTP server:
  - позитивний сценарій PASS для повного expected error contract shape;
  - негативний сценарій FAIL при дрейфі `code` для route-not-found;
  - негативний сценарій FAIL при втраті `details.fieldErrors.email` у validation response.
- Додано self-test `scripts/test-check-settings-i18n-consistency.mjs` з локальним mock HTTP server:
  - позитивний сценарій PASS при консистентних uk/en settings;
  - негативний сценарій FAIL для `heroSubtitle` mismatch;
  - негативний сценарій FAIL для mirrored `title` mismatch.
- Інтегровано обидва нові helper self-tests у local pre-release gate та CI workflow.
- Оновлено release документацію (`README`, `RELEASE_RUNBOOK`) зі згадкою нових mandatory helper checks.

## Що покращило/виправило/додало

- Знижено release-risk: gate-critical verifier scripts тепер мають окремий fail-fast self-test шар.
- Раннє виявлення регресій у контрактній валідації підвищує стабільність local/CI gate.
- Якість pre-release перевірок стала більш рівномірною між helper-тестами без збільшення залежності від живого API.
