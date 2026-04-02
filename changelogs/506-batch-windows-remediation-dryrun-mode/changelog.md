# 506 Batch - Windows remediation dry-run mode

## Як було

- One-shot PowerShell remediation скрипт одразу виконував запис нової версії `DATABASE_URL` у Secret Manager, якщо знаходив потрібне оновлення `sslmode`.
- Перед реальним записом не було окремого безпечного режиму для preflight-перевірки на Windows.

## Що зроблено

- Розширено [scripts/set-database-url-pooler-sslmode-secret.ps1](scripts/set-database-url-pooler-sslmode-secret.ps1):
  - додано параметр `-DryRun`;
  - у dry-run режимі скрипт **не** виконує `gcloud secrets versions add`;
  - виконується strict policy verify для кандидатного (ремедійованого) URL без запису в Secret Manager.
- Оновлено troubleshooting у [README.md](README.md):
  - додано окремий приклад запуску `-DryRun` для безпечного preview.

## Що покращило

- Додано безпечний preflight для Windows-операторів перед зміною production secret.
- Зменшено ризик ненавмисного запису secret-помилковим запуском.
- Збережено strict policy гарантію завдяки валідації кандидатного URL у dry-run сценарії.
