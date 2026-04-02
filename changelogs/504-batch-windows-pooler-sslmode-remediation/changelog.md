# 504 Batch - Windows pooler sslmode remediation

## Як було

- Manual remediation для `unsupported_sslmode_for_pooler_endpoint` у документації була орієнтована переважно на Bash-команди.
- Для Windows/Pwsh оператору потрібно було вручну комбінувати кілька команд (`gcloud` + Node helper + strict verify), що підвищувало ризик помилки.

## Що зроблено

- Додано новий one-shot скрипт [scripts/set-database-url-pooler-sslmode-secret.ps1](scripts/set-database-url-pooler-sslmode-secret.ps1), який:
  - читає latest версію секрета `DATABASE_URL` з Google Secret Manager;
  - застосовує pooler sslmode remediation через `scripts/set-database-url-pooler-sslmode.mjs`;
  - додає нову версію секрета (якщо є зміни);
  - виконує strict-перевірку через `scripts/check-database-url-policy.mjs --strict`.
- Розділ troubleshooting у [README.md](README.md) доповнено PowerShell прикладом запуску цього one-shot скрипта.

## Що покращило

- Спрощено та уніфіковано recovery-флоу для Windows середовища.
- Зменшено ймовірність ручних помилок під час виправлення `DATABASE_URL` для Supabase pooler endpoint.
- Прискорено операційне розблокування deploy/rollback без послаблення strict policy.
