# Batch 400: Audit Shortcut Event Safety Guards

## Як було
- `handleAuditKeyboardShortcuts` обробляв refresh shortcut без частини базових event-safety перевірок.
- Це могло теоретично перехоплювати комбінацію в контексті введення тексту або при вже `defaultPrevented` події.

## Що зроблено
- На початку `handleAuditKeyboardShortcuts` додано додаткові guard-и:
  - `!event`
  - `event.defaultPrevented`
  - `currentTarget/target.isConnected === false`
  - `event.isComposing`
  - ігнорування editable target (`contentEditable`, `INPUT`, `TEXTAREA`, `SELECT`)
- Існуючий `event.repeat` guard збережено.

## Що покращило / виправило / додало
- Зменшено ризик небажаного перехоплення shortcut у полях вводу.
- Посилено стійкість keyboard handler до невалідних/вже оброблених подій.

## Validation
- Diagnostics check for `admin.js`: **No errors found**.
