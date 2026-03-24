# 448 Batch - Contact status id and status guards

як було:

- `changeContactStatus` приймав `id/status` без явної валідації перед adapter-викликом.
- За edge-case значень (наприклад, `NaN` або неочікуваний status) можливий був некоректний update-запит.

що зроблено:

- Додано нормалізацію `id` у число та guard на `Number.isFinite`.
- Додано allowlist-guard для `status`: `new`, `in_progress`, `done`.
- Adapter-виклик і activity-лог переведено на `normalizedId`.

що покращило/виправило/додало:

- Зменшено ризик відправки невалідних параметрів у contact-status update.
- Підвищено передбачуваність поведінки без зміни штатного сценарію.
