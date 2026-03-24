# 444 Batch - OpenModal cache array guard

- як було:
  - У `openModal` edit-гілка викликала `.find(...)` для `cache[collection]`.
  - Якщо `cache[collection]` випадково був не-масивом (пошкоджений state), це могло призвести до runtime-помилки.

- що зроблено:
  - Додано `collectionItems` з безпечною нормалізацією: використовується масив тільки якщо `Array.isArray(...)`, інакше порожній масив.
  - Пошук `matchedItem` переведено на `collectionItems.find(...)`.

- що покращило/виправило/додало:
  - Усунуто edge-case падіння `openModal` при невалідній структурі кешу.
  - Посилено стійкість edit-flow без змін штатної поведінки.
