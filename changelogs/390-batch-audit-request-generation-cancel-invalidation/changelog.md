# Batch 390: Audit Request Generation Cancel Invalidation

`cancelAuditRequest()` лише абортив активний controller, але не інвалідовував request generation.
У `loadAuditLogs()` `requestSeq` створювався до `cancelAuditRequest()`, що ускладнювало безпечне generation-based invalidation.

## Що зроблено

## 1) `cancelAuditRequest` інвалідовує request generation

Додано:

- `auditRequestSeq += 1;`

Тепер будь-які pending callback-и попередніх запитів гарантовано стають stale по `requestSeq`.

## 2) Узгоджено порядок ініціалізації в `loadAuditLogs`

Перенесено `cancelAuditRequest()` перед створенням нового `requestSeq`.
Новий порядок:

- `cancelAuditRequest();`
- `const requestSeq = ++auditRequestSeq;`

Це зберігає коректну відповідність між локальним `requestSeq` і актуальним поколінням запиту.

Підвищено детермінованість відсікання stale audit-відповідей.
Зменшено ризик race-ефектів при швидких ручних/авто refresh та навігаційних скасуваннях.

Diagnostics check for `admin.js`: **No errors found**.
