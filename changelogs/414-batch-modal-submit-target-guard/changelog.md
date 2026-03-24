# Batch 414: Modal Submit Target Guard

## Як було

У submit handler для `modal-form` `FormData` створювався напряму з `e.target` без перевірки валідності/connected state.
У нештатному event-контексті це могло спричинити runtime-помилку.

## Що зроблено

Перед створенням `FormData` додано defensive-перевірки:

- `const formEl = e.target;`
- `if (!formEl || formEl.isConnected === false) return;`

`FormData` тепер створюється з перевіреного `formEl`.

## Що покращило / виправило / додало

Підвищено стійкість modal submit flow до edge-case подій.
Зменшено ризик uncaught помилок при невалідному target.

## Validation

Diagnostics check for `admin.js`: **No errors found**.
