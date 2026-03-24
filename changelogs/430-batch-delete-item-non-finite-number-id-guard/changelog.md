# 430 Batch - Delete item non-finite number id guard

як було:

- `deleteItem` валідовував `type`, `null/undefined`, порожній строковий `id`, але не відсікав `NaN/Infinity`.

що зроблено:

- Додано ранній guard: якщо `id` має тип `number` і `Number.isFinite(id)` повертає `false`, функція завершується.

що покращило/виправило/додало:

- Усунуто edge-case видалення з некоректним числовим ідентифікатором.
- Вирівняно валідацію delete-flow з edit-flow без змін штатної поведінки.
