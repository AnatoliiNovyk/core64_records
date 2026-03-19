# Batch 411: `resetData` Concurrency Guard

## Як було
- `resetData()` не мав guard-а від повторного запуску.
- При кількох швидких кліках міг стартувати дубльований reset-flow.

## Що зроблено
- Додано глобальний прапорець:
  - `let resetDataInProgress = false;`
- У `resetData()`:
  - early return, якщо вже в процесі
  - встановлення `resetDataInProgress = true` перед операціями
  - скидання прапорця у `finally`

## Що покращило / виправило / додало
- Усунуто ризик конкурентних reset-операцій.
- Підвищено стабільність reset-flow при повторних швидких взаємодіях.

## Validation
- Diagnostics check for `admin.js`: **No errors found**.
