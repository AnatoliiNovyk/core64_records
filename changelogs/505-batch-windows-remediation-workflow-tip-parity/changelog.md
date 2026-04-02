# 505 Batch - Windows remediation workflow tip parity

## Як було

- У deploy/rollback workflow при strict-помилці `unsupported_sslmode_for_pooler_endpoint` у логах були тільки Bash-команди для manual remediation.
- Доданий PowerShell one-shot скрипт існував у репозиторії та документації, але не був прямо підказаний у CI логах.
- У PowerShell one-shot скрипті бракувало уніфікованої перевірки exit code для всіх зовнішніх викликів `gcloud`/`node`.

## Що зроблено

- Оновлено [deploy workflow](.github/workflows/deploy-google-run.yml):
  - у блоці manual remediation додано Windows-підказку з готовою командою запуску:
    - `pwsh -NoProfile -File scripts/set-database-url-pooler-sslmode-secret.ps1 ...`
- Оновлено [rollback workflow](.github/workflows/rollback-google-run.yml):
  - додано аналогічну Windows one-shot підказку у той самий remediation-блок.
- Посилено [scripts/set-database-url-pooler-sslmode-secret.ps1](scripts/set-database-url-pooler-sslmode-secret.ps1):
  - додані helper-функції `Invoke-GcloudText`, `Invoke-GcloudNoOutput`, `Invoke-NodeText` з обов'язковою перевіркою `$LASTEXITCODE`;
  - замінено прямі зовнішні виклики на ці helper-и для читання/оновлення secret та strict verify.

## Що покращило

- Оператор бачить Windows-ready команду прямо в CI логах deploy/rollback без додаткового пошуку в документації.
- Зменшено ризик тихих partial-failure у PowerShell one-shot ремедіації.
- Підвищено консистентність операційного досвіду між Linux/Bash та Windows/Pwsh шляхами.
