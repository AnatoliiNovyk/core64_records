# 423 Batch - Edit item type allowlist guard

як було:

- `editItem` напряму викликав `openModal(type, id)` без локальної валідації `type`.

що зроблено:

- Додано ранній allowlist-guard у `editItem`: виконання продовжується тільки для `release`, `artist`, `event`.

що покращило/виправило/додало:

- Зменшено ризик зайвого входу в modal-flow при невалідному `type`.
- Посилено захист на вході (defense in depth) без зміни штатної логіки редагування.
