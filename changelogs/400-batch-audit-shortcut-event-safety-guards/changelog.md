# Batch 400: Audit Shortcut Event Safety Guards

`handleAuditKeyboardShortcuts` обробляв refresh shortcut без частини базових event-safety перевірок.
Це могло теоретично перехоплювати комбінацію в контексті введення тексту або при вже `defaultPrevented` події.

На початку `handleAuditKeyboardShortcuts` додано додаткові guard-и:

- `!event`
- `event.defaultPrevented`
- `currentTarget/target.isConnected === false`
- `event.isComposing`
- ігнорування editable target (`contentEditable`, `INPUT`, `TEXTAREA`, `SELECT`)

Існуючий `event.repeat` guard збережено.

Зменшено ризик небажаного перехоплення shortcut у полях вводу.
Посилено стійкість keyboard handler до невалідних/вже оброблених подій.

Diagnostics check for `admin.js`: **No errors found**.
