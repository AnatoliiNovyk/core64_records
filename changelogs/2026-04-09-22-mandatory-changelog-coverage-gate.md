# 2026-04-09-22 Mandatory Changelog Coverage Gate

## Як було

- Pre-release gate не мав автоматичної fail-fast перевірки, що commit-range покритий changelog-артефактами.
- Наявність changelog контролювалась переважно дисципліною процесу, а не обов'язковим gate-кроком.
- У CI/local gate можна було пройти перевірки без машинної валідації changelog coverage.

## Що зроблено

- Додано новий verifier-скрипт [scripts/verify-changelog-coverage.mjs](scripts/verify-changelog-coverage.mjs):
  - приймає `--base` і `--head` git refs;
  - аналізує non-merge commits у заданому range;
  - вимагає changelog coverage для commit'ів із non-doc змінами;
  - завершується з `exit 1`, якщо знайдено uncovered commits.
- Інтегровано обов'язковий changelog coverage check у local gate [scripts/pre-release-gate-local.ps1](scripts/pre-release-gate-local.ps1):
  - додано параметри `Core64ChangelogBaseRef` і `Core64ChangelogHeadRef`;
  - додано ранній fail-fast крок `Validating changelog coverage`.
- Інтегровано обов'язковий changelog coverage check у CI gate [.github/workflows/pre-release-gate.yml](.github/workflows/pre-release-gate.yml):
  - додано workflow inputs `core64_changelog_base_ref` і `core64_changelog_head_ref`;
  - додано input validation;
  - додано крок `Validate changelog coverage`;
  - встановлено `actions/checkout` з `fetch-depth: 2` для стабільного range-check.
- Оновлено [RELEASE_RUNBOOK.md](RELEASE_RUNBOOK.md) з явною фіксацією mandatory changelog coverage перевірки.

## Що покращило/виправило/додало

- Release hygiene став fail-fast і детермінованим щодо changelog coverage.
- Зменшено ризик "тихих" кодових змін без супровідного changelog у стандартному релізному контурі.
- Local і CI gate тепер синхронно застосовують однакову політику changelog coverage.
