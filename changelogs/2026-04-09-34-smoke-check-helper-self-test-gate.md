# 2026-04-09-34 Smoke-Check Helper Self-Test Gate

## Як було

- `scripts/smoke-check.mjs` був критичним helper у release контурі, але не мав окремого self-test.
- Регресії в smoke oracle могли проявлятися лише під час живого запуску gate/CI.
- Local/CI pre-release не мали fail-fast кроку для перевірки smoke helper логіки у відриві від реального backend.

## Що зроблено

- Додано новий mock-based self-test `scripts/test-smoke-check.mjs`.
- У self-test покрито контрольовані сценарії:
  - happy-path PASS;
  - відсутній `report-uri` у CSP;
  - login failure (401);
  - rate-limit не спрацьовує у відведені attempts;
  - відсутній required `sectionKey` у settings sections;
  - CSP report endpoint повертає non-204.
- Інтегровано `test-smoke-check.mjs` у local pre-release gate та CI workflow як helper self-test до основного smoke check.
- Оновлено `README` і `RELEASE_RUNBOOK` зі згадкою нового mandatory helper check.

## Що покращило/виправило/додало

- Зменшено release-risk: критичний smoke helper тепер має окремий fail-fast self-test шар.
- Прискорено діагностику регресій smoke oracle завдяки ізольованим mock сценаріям.
- Підвищено паритет local/CI перевірок у helper-блоці перед основним smoke.
