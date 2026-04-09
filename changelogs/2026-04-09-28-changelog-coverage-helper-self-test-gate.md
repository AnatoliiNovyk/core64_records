# 2026-04-09-28 Changelog Coverage Helper Self-test Gate

## Як було

- `scripts/verify-changelog-coverage.mjs` виконувався в pre-release gate, але без окремого helper self-test.
- Через це можливі регресії в coverage verifier логіці не мали ізольованого раннього сигналу до основного gate-потоку.
- У release runbook був зафіксований coverage check, але не було явної вимоги coverage helper self-test.

## Що зроблено

- Додано новий self-test `scripts/test-verify-changelog-coverage.mjs`:
  - використовує тимчасовий git-репозиторій для ізольованих сценаріїв;
  - перевіряє позитивний кейс (implementation + changelog -> PASS);
  - перевіряє негативний кейс (implementation без changelog -> FAIL);
  - перевіряє doc-only commit і empty range (PASS);
  - перевіряє обробку invalid refs/args (FAIL) і `--json` output shape (PASS).
- Інтегровано coverage helper self-test у local gate `scripts/pre-release-gate-local.ps1` одразу після changelog format helper self-test.
- Інтегровано coverage helper self-test у CI gate `.github/workflows/pre-release-gate.yml` кроком `Validate changelog coverage helper`.
- Оновлено `RELEASE_RUNBOOK.md` із фіксацією обов'язковості coverage helper self-test у pre-release контурі.

## Що покращило/виправило/додало

- Підвищено стійкість release gate: тепер coverage verifier має окремий self-test guard до основних перевірок.
- Зменшено ризик прихованого дрейфу в changelog coverage логіці.
- Уніфіковано quality-bar для обох changelog verifier-скриптів (format + coverage) у local/CI gate.
