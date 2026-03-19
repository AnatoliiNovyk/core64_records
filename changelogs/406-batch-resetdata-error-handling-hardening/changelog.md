# Batch 406: `resetData` Error Handling Hardening

## Як було
- `resetData()` виконував `localStorage.removeItem`, `adapter.ensureLocalDefaults()` і `location.reload()` без `try/catch`.
- При runtime/storage помилці flow міг перериватись без контрольованого фідбеку користувачу.

## Що зроблено
- Обгорнуто логіку `resetData()` у `try/catch`.
- У `catch` додано:
  - `console.error("Reset data failed", error)`
  - `alert("Не вдалося скинути локальні дані. Спробуйте ще раз.")`

## Що покращило / виправило / додало
- Підвищено стійкість reset-flow у браузерних edge-case (storage restrictions тощо).
- Користувач отримує зрозумілий фідбек замість silent/uncaught failure.

## Validation
- Diagnostics check for `admin.js`: **No errors found**.
