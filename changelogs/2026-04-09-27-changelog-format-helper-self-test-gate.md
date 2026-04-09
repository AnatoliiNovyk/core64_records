# 2026-04-09-27 Changelog Format Helper Self-test Gate

## Як було

- `scripts/verify-changelog-format.mjs` вже був інтегрований у local/CI pre-release gate, але не мав окремого self-test.
- Через це регресія у самому verifier могла потрапити в gate без раннього сигналу на рівні helper-тесту.
- У runbook був опис format-check, але не було зафіксовано окрему helper self-test перевірку.

## Що зроблено

- Додано новий self-test `scripts/test-verify-changelog-format.mjs`:
  - використовує тимчасовий git-репозиторій для ізольованої перевірки verifier;
  - покриває позитивний кейс (валідний 3-секційний changelog);
  - покриває негативний кейс (відсутня обов'язкова секція);
  - покриває порожній range без змінених changelog markdown;
  - перевіряє JSON output shape (`--json`).
- Інтегровано helper self-test у local gate `scripts/pre-release-gate-local.ps1` одразу після `Validating changelog format`.
- Інтегровано helper self-test у CI gate `.github/workflows/pre-release-gate.yml` кроком `Validate changelog format helper`.
- Оновлено `RELEASE_RUNBOOK.md` для фіксації обов'язковості цього helper self-test у pre-release контурі.

## Що покращило/виправило/додало

- Підвищено надійність release gate: тепер перевіряється не лише результат format-check, а й коректність самого verifier.
- Зменшено ризик прихованих регресій у changelog format guard-логіці.
- Покращено прозорість релізного процесу за рахунок явного відображення helper self-test у runbook і gate-кроках.
