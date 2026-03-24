# 451 Batch - Modal fields template sanitization

як було:

- generateFields вставляв значення `item.*` в HTML-шаблони форми напряму.
- Для частини полів (value/src/textarea) не було централізованої санітизації перед interpolation.
- Це створювало ризик ін’єкцій у розмітку адмін-модалки при неочікуваних даних.

що зроблено:

- Посилено generateFields централізованою нормалізацією вхідного item:
- sourceItem guard (тільки object, інакше порожній об’єкт).
- normalizeFieldValue (sanitizeInput з fallback).
- fieldValues object для всіх полів, що рендеряться в шаблоні.
- Замінив прямі вставки `item.*` на `fieldValues.*` в усіх гілках (release/artist/event).
- imagePreview і preview img тепер використовують санітизований image value.
- Логіку selected для genre збережено через rawGenre, щоб не змінювати UX вибору в select.

що покращило/виправило/додало:

- Знижено ризик XSS/markup injection у модальному CRUD-формі.
- Уніфіковано обробку значень перед рендерингом (одна точка нормалізації).
- Поведінка валідних сценаріїв залишилась незмінною.
