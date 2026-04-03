# 513 Batch - smoke fail-fast for auth/config DB errors

## Як було

- Post-deploy/post-rollback smoke loops завжди робили retry, навіть коли `healthDb` повертав non-transient помилки (`auth`, `config`, `28P01`).
- Для auth-помилок це спричиняло зайві 2 повтори без шансів на success і затягувало feedback cycle.

## Що зроблено

- Оновлено [deploy workflow](.github/workflows/deploy-google-run.yml):
  - після невдалого `scripts/smoke-check.mjs` результат парситься з JSON-output;
  - якщо `healthDb.kind=auth|config` або `healthDb.dbCode=28P01`, workflow завершується fail-fast без retry;
  - друкується явна remediation-підказка: перевірити credentials/encoding у `DATABASE_URL` secret.
- Оновлено [rollback workflow](.github/workflows/rollback-google-run.yml):
  - додано аналогічну fail-fast логіку для non-transient auth/config DB збоїв.
- Оновлено [README.md](README.md):
  - додано опис нового fail-fast поведінкового правила для deploy/rollback smoke loops.

## Що покращило

- Прискорено діагностику і реакцію на auth/config інциденти (немає марних retry).
- Зменшено шум у CI логах і час до actionable remediation.
- Узгоджено поведінку smoke loops між deploy і rollback сценаріями.
