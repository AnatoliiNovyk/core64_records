# 431 Batch - Open modal supported id type guard

як було:

- `openModal` нормалізував строковий `id`, але не відсікав нетипові значення `id` (наприклад, `object`, `boolean`, `symbol`).

що зроблено:

- Додано ранній guard після нормалізації `id`: функція продовжується тільки для `null/undefined`, `string` або `number`.

що покращило/виправило/додало:

- Усунуто edge-case потрапляння неочікуваних типів `id` у modal-state.
- Підвищено стабільність edit/create-flow без змін штатної поведінки для валідних `id`.
