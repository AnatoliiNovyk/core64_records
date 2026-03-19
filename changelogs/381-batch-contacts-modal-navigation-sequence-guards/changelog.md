# Batch 381: Contacts/Modal Navigation Sequence Guards

## Summary
Розширено `sectionNavigationSeq`-hardening на async-операції контактів і modal save/delete флоу, щоб старі проміси не оновлювали UI у новішому контексті навігації.

## Як було
- У `changeContactStatus`, `bulkUpdateContactStatus`, modal submit та `deleteItem` були перевірки секції й DOM, але без навігаційного токена.
- При сценарії "перехід в іншу секцію та повернення назад" старий async-ланцюг міг теоретично пройти перевірки по назві секції.

## Що зроблено

### 1) Contacts async flows
- Додано capture токена:
  - `navigationSeqAtUpdate` у `changeContactStatus`
  - `navigationSeqAtBulkUpdate` у `bulkUpdateContactStatus`
- Додано `sectionNavigationSeq`-перевірки:
  - після кожного `await`
  - у `catch` перед error/UI handling

### 2) Modal submit flow
- Додано `navigationSeqAtSubmit`.
- Додано перевірки:
  - після `adapter.updateItem/createItem`
  - після `await showSection(sectionAtSubmit)`
  - після `await loadDashboard()`
  - у `catch`

### 3) Delete flow
- Додано `navigationSeqAtDelete`.
- Додано перевірки:
  - після `await adapter.deleteItem(...)`
  - після `await showSection(sectionAtDelete)`
  - після `await loadDashboard()`
  - у `catch`

## Що покращило / виправило / додало
- Зменшено ризик stale UI-мутацій у contacts/modal flow після швидких переходів між секціями.
- Підвищено детермінованість результатів save/delete/status update операцій.

## Validation
- Diagnostics check for `admin.js`: **No errors found**.
