# Batch 409: Modal Submit Listener Single-Bind Guard

Після defensive-binding для `modal-form` listener все ще міг дублюватися при повторній ініціалізації скрипта.

У блоці реєстрації submit listener додано одноразовий guard через dataset:

- `if (!modalFormEl.dataset.submitListenerBound) { ... }`
- після bind: `modalFormEl.dataset.submitListenerBound = "1"`

Усунуто ризик множинної реєстрації одного й того ж submit handler-а.
Зменшено ймовірність дубльованих create/update запитів через повторні callback-и.

Diagnostics check for `admin.js`: **No errors found**.
