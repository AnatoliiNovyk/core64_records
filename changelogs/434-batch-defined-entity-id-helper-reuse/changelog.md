# 434 Batch - Defined entity id helper reuse

- як було:
  - Перевірка `id !== null && id !== undefined` повторювалась у кількох місцях (`openModal`, submit-обробник, id-утиліти).

- що зроблено:
  - Додано helper `hasDefinedEntityId(id)`.
  - `openModal` переведено на `hasDefinedEntityId(editingId)` для визначення edit/create гілки.
  - Submit-обробник модалки переведено на `hasDefinedEntityId(editingIdAtSubmit)`.
  - `hasUsableEntityId` оновлено для використання нового helper-а.

- що покращило/виправило/додало:
  - Зменшено дублювання та ризик дрейфу однакової null/undefined перевірки.
  - Підвищено читабельність без зміни функціональної поведінки.
