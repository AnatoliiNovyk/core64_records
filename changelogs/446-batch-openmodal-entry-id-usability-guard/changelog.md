# 446 Batch - OpenModal entry id usability guard

- як було:
  - У `openModal` lookup порівнював `Number(entry.id)` з `Number(editingId)` без окремої перевірки придатності `entry.id`.
  - Це могло дати хибні збіги в edge-case станах кешу (наприклад, `null`/порожні `id` з числовою коерсією).

- що зроблено:
  - У predicate додано нормалізацію `entry.id` через `normalizeEntityId`.
  - Додано guard через `hasUsableEntityId(entryId)` перед числовим порівнянням.
  - Порівняння виконується лише для валідного `entryId`.

- що покращило/виправило/додало:
  - Зменшено ризик хибного match у edit-flow при нестандартному вмісті кешу.
  - Підвищено точність і передбачуваність пошуку редагованого елемента.
