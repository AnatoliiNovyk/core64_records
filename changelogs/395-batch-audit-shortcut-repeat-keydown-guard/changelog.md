# Batch 395: Audit Shortcut Repeat Keydown Guard

`handleAuditKeyboardShortcuts` реагував на shortcut без фільтрації `event.repeat`.
Утримання клавіші могло запускати серію повторних refresh-викликів.

На початку `handleAuditKeyboardShortcuts` додано guard:

- `if (event && event.repeat) return;`

Усунуто небажаний каскад повторних refresh-тригерів при утриманні гарячої клавіші.
Зменшено навантаження на audit refresh flow та потенційні конкурентні запити.

Diagnostics check for `admin.js`: **No errors found**.
