# 433 Batch - Entity guard helpers and openModal id=0 fix

- як було:
  - У `openModal` залишався falsy-check `if (editingId)`, через що `id = 0` визначався як create-режим.
  - Валідація `type/id` дублювалась у `openModal`, `editItem`, `deleteItem` окремими інлайн-перевірками.

- що зроблено:
  - Додано спільні helper-функції для цієї зони:
    - `isSupportedEntityType`
    - `normalizeEntityId`
    - `isSupportedEntityIdValue`
    - `hasUsableEntityId`
    - константу `SUPPORTED_ENTITY_TYPES`
  - У `openModal` замінено інлайн-guard-и на helper-виклики.
  - У `openModal` виправлено визначення edit-режиму: `if (editingId !== null && editingId !== undefined)`.
  - У `editItem` та `deleteItem` застосовано нормалізацію id і спільний guard через helper-и.
  - У `deleteItem` adapter-виклик та activity-лог переведено на `normalizedId`.

- що покращило/виправило/додало:
  - Усунуто реальний edge-case з `id = 0` в `openModal`.
  - Зменшено дублювання перевірок і підвищено консистентність валідації.
  - Логіка залишилась behavior-preserving для валідних сценаріїв.
