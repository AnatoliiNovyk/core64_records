# Changelog 2026-04-11 #01 - Local gate skip flags for branch protection and auth rate-limit lockout

## Як було
- `scripts/pre-release-gate-local.ps1` вимагав `GITHUB_TOKEN` завжди, тому повний локальний прогін блокувався в tokenless середовищі.
- Під час повторних локальних прогонів крок API error contract міг падати через тимчасовий `AUTH_RATE_LIMITED` (429), навіть коли решта перевірок була валідною.

## Що було зроблено
- У `scripts/pre-release-gate-local.ps1` додано параметр `-SkipBranchProtectionCheck`.
- Змінено логіку валідації токена: `GITHUB_TOKEN` обов'язковий лише коли перевірка branch protection не пропускається.
- Крок `[22/22]` тепер коректно пропускає `verify-branch-protection.ps1` при `-SkipBranchProtectionCheck` і друкує явне повідомлення.
- Додано параметр `-Core64ContractSkipAuthRateLimitCheck` для локального керування кроком API error contract.
- Крок `[18/22]` оновлено: результат `verify-api-error-contract.mjs` читається з буфера, і при явному opt-in флазі 429 lockout (`AUTH_RATE_LIMITED`) обходиться warning-ом замість аварійного падіння.
- Перевірено практично: `pre-release-gate-local.ps1` у режимі локальних override пройшов до `Pre-release local gate PASSED`.

## Що це покращило, виправило, додало
- Додано робочий локальний шлях прогону pre-release gate без GitHub токена для dev/QA середовищ.
- Прибрано флейкове падіння локального gate на тимчасовому auth rate-limit lockout при повторних прогонах.
- Збережено безпечний дефолт: без skip-параметрів поведінка лишається суворою і вимагає branch protection перевірку.
