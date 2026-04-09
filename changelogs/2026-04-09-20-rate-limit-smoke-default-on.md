# 2026-04-09-20 Rate-Limit Smoke Default On

## Як було

- Перевірка 429 для mutation rate-limit запускалась лише як opt-in через `CORE64_SMOKE_RATE_LIMIT_CHECK=true`.
- У локальному та CI gate цей сценарій за замовчуванням був вимкнений, тому стандартний прогін міг не перевіряти security boundary.
- У runbook не було явної вимоги, що rate-limit smoke є обов'язковою частиною стандартного smoke.

## Що зроблено

- У [scripts/smoke-check.mjs](scripts/smoke-check.mjs) змінено default для `CORE64_SMOKE_RATE_LIMIT_CHECK` на `true`.
- У [scripts/pre-release-gate-local.ps1](scripts/pre-release-gate-local.ps1) змінено default параметра `Core64SmokeRateLimitCheck` на `$true` і уніфіковано повідомлення кроку rate-limit smoke.
- У [.github/workflows/pre-release-gate.yml](.github/workflows/pre-release-gate.yml) змінено default input `core64_smoke_rate_limit_check` на `"true"` та оновлено назву кроку запуску.
- У [RELEASE_RUNBOOK.md](RELEASE_RUNBOOK.md) додано вимогу default-on rate-limit smoke і правила emergency opt-out.

## Що покращило/виправило/додало

- Кожен стандартний smoke/gate прогін тепер за замовчуванням перевіряє 429-поведінку для mutation routes.
- Зменшено ризик false-green релізу, коли базові чеки проходять, але rate-limit регресія лишається непоміченою.
- Збережено контрольований fallback: explicit opt-out доступний лише для аварійного triage.
