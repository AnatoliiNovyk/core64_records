# 509 Batch - Runtime TLS hint helper and gate integration

## Як було

- У deploy pre-migrate diagnostics був strict policy verdict і safe DB snapshot, але не було окремого зрізу ефективної runtime TLS семантики.
- Для self-signed сценарію (`DB_SSL_ALLOW_SELF_SIGNED=true`) оператору доводилось вручну інтерпретувати, чи спрацює libpq-compat логіка.
- Pre-release gates не мали окремого self-test для такого TLS hint helper.

## Що зроблено

- Додано новий helper [scripts/print-db-runtime-tls-hint.mjs](scripts/print-db-runtime-tls-hint.mjs):
  - читає `DATABASE_URL_VALUE` + `DB_SSL` + `DB_SSL_REJECT_UNAUTHORIZED` + `DB_SSL_ALLOW_SELF_SIGNED`;
  - друкує safe JSON-підказку про `sslmode`, pooler endpoint, `uselibpqcompat` (explicit/effective), та expected runtime behavior;
  - підтримує `--strict` режим (fail-fast при невалідному/порожньому URL).
- Додано self-test [scripts/test-print-db-runtime-tls-hint.mjs](scripts/test-print-db-runtime-tls-hint.mjs).
- Оновлено [deploy workflow](.github/workflows/deploy-google-run.yml):
  - у `Run database migration/seed` додано pre-migrate крок логування runtime TLS hint через новий helper.
- Оновлено pre-release gates:
  - [.github/workflows/pre-release-gate.yml](.github/workflows/pre-release-gate.yml): додано запуск нового self-test;
  - [scripts/pre-release-gate-local.ps1](scripts/pre-release-gate-local.ps1): додано self-test і вирівняно нумерацію кроків до `1/8` ... `8/8`.
- Оновлено [README.md](README.md) у секції deploy з описом нового pre-migrate runtime TLS hint.

## Що покращило

- CI логи до `npm run migrate` тепер одразу показують ефективний TLS/runtime контекст без витоку credentials.
- Швидше відділяються policy/sslmode проблеми від route/network timeout інцидентів.
- Зменшено ризик регресій завдяки окремому self-test і включенню його в pre-release gates.
