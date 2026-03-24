# 436 Batch - Submit normalized editing id consistency

як було:

- Submit-обробник модалки читав `editingId` напряму та визначав режим через `hasDefinedEntityId`.
- За атипового стану (наприклад, ненормалізований рядковий id) рішення edit/create і payload `id` могли бути менш консистентними.

що зроблено:

- У submit-обробнику `editingId` тепер попередньо нормалізується через `normalizeEntityId`.
- Режим edit/create визначається через `hasUsableEntityId`.
- Присвоєння `item.id` переведено на явну логіку: `editingId` для edit-режиму, `Date.now()` для create-режиму.

що покращило/виправило/додало:

- Підвищено консистентність submit-flow між нормалізацією id та фактичним payload.
- Зменшено ризик edge-case розсинхрону edit/create рішення без зміни штатної поведінки.
