# 2026-04-09-21 Release Owner Diversity Validator

## Як було

- Pre-release gate не перевіряв, чи ключові release ролі розподілені між кількома людьми.
- При bus factor = 1 релізний процес міг проходити без автоматичного fail-fast сигналу.
- У документації не було формалізованої policy для role diversity та контрольованого emergency override.

## Що зроблено

- Додано новий скрипт [scripts/verify-release-owner-assignments.ps1](scripts/verify-release-owner-assignments.ps1):
  - читає [RELEASE_OWNERS_AND_ESCALATION.md](RELEASE_OWNERS_AND_ESCALATION.md);
  - перевіряє mandatory ролі (Release Commander, Deployer, Verifier, Database Owner, Communications Owner);
  - валідує мінімум 3 унікальні non-empty assignees;
  - повертає structured JSON результат і fail-fast статус;
  - підтримує emergency override через `OverrideRoleDiversity`.
- Інтегровано перевірку в local gate [scripts/pre-release-gate-local.ps1](scripts/pre-release-gate-local.ps1):
  - додано параметр `Core64OverrideRoleDiversity`;
  - додано ранній крок перевірки перед smoke/self-tests.
- Інтегровано перевірку в CI gate [.github/workflows/pre-release-gate.yml](.github/workflows/pre-release-gate.yml):
  - додано input `core64_override_role_diversity`;
  - додано валідацію input;
  - додано fail-fast крок `Validate release owner assignments`.
- Оновлено policy-документацію:
  - [RELEASE_OWNERS_AND_ESCALATION.md](RELEASE_OWNERS_AND_ESCALATION.md) — нова секція Role Diversity Requirement;
  - [RELEASE_RUNBOOK.md](RELEASE_RUNBOOK.md) — згадка про обов'язковість check і emergency override.

## Що покращило/виправило/додало

- Додано governance fail-fast контроль, який зменшує release bus-factor ризик.
- Local і CI gate тепер перевіряють однакову policy для role assignments.
- Збережено контрольований аварійний шлях через явний override з обов'язковим логуванням/комунікацією.
