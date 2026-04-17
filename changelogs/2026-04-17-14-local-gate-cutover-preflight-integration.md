# 2026-04-17-14 Local Gate Cutover Preflight Integration

## Як було

- Локальний release gate не мав вбудованого кроку для strict preflight кандидатного `DATABASE_URL` під час cutover на новий Postgres.
- Preflight helper існував окремо, але не був інтегрований у `scripts/pre-release-gate-local.ps1`, тому перевірка залежала від ручного запуску.

## Що зроблено

- У `scripts/pre-release-gate-local.ps1` додано новий опційний параметр:
- `-Core64CutoverCandidateDatabaseUrl`
- Додано функцію `Invoke-CutoverCandidateDbPreflight`, яка:
- тимчасово встановлює `DATABASE_URL_VALUE`;
- запускає `node scripts/check-postgres-cutover-readiness.mjs --strict`;
- відновлює попереднє значення env-перемінної після завершення.
- У gate додано обов'язковий self-test нового helper-а:
- `node scripts/test-check-postgres-cutover-readiness.mjs`
- У gate додано умовний preflight-крок:
- якщо `Core64CutoverCandidateDatabaseUrl` заданий — виконується strict preflight і gate падає при помилці;
- якщо параметр порожній — крок пропускається без впливу на стандартний релізний флоу.
- Оновлено `RELEASE_RUNBOOK.md` з прикладом запуску локального gate з новим параметром.

## Що покращило/виправило/додало

- Зменшено ризик помилки під час cutover: strict preflight можна запускати прямо в єдиному локальному gate-процесі.
- Підвищено відтворюваність релізної перевірки: helper self-test тепер входить у стандартний набір локальних self-test кроків.
- Збережено зворотну сумісність: стандартний release gate без нового параметра працює як раніше.
