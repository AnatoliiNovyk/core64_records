# Batch 411: `resetData` Concurrency Guard

`resetData()` не мав guard-а від повторного запуску.
При кількох швидких кліках міг стартувати дубльований reset-flow.

Додано глобальний прапорець:

- `let resetDataInProgress = false;`

У `resetData()`:

- early return, якщо вже в процесі
- встановлення `resetDataInProgress = true` перед операціями
- скидання прапорця у `finally`

Усунуто ризик конкурентних reset-операцій.
Підвищено стабільність reset-flow при повторних швидких взаємодіях.

Diagnostics check for `admin.js`: **No errors found**.
