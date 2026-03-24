# 449 Batch - Contacts flow robustness package

як було:

- Валідація `id/status` у контактах була розподілена частково і дублювалась.
- `bulkUpdateContactStatus` працював по `cache.contactRequests` без повної нормалізації структури елементів.
- `changeContactsPage` не мав явної валідації `delta`.

що зроблено:

- Додано централізовані helper-и контактів:
- `isSupportedContactRequestStatus`
- `normalizeContactRequestId`
- `CONTACT_REQUEST_ALLOWED_STATUSES`
- `changeContactStatus` переведено на helper-валідацію id/status.
- `bulkUpdateContactStatus` посилено:
- ранні guard-и на валідність `fromStatus/toStatus`;
- guard на масивність `cache.contactRequests`;
- нормалізація та фільтрація тільки валідних записів перед масовим update.
- `changeContactsPage` отримав guard на коректний integer `delta`.

що покращило/виправило/додало:

- Підвищено стійкість contact-flow до пошкодженого кешу та невалідних аргументів.
- Зменшено дублювання перевірок через централізовані helper-и.
- Збережено штатну поведінку для валідних сценаріїв.

доповнення пакета (render/filter/export hardening):

- `getStatusLabel` переведено на централізовану нормалізацію статусу через `normalizeContactRequestStatus`.
- `getFilteredContacts` посилено:
- ранній guard на масивність `cache.contactRequests`;
- відсікання невалідних/порожніх записів;
- порівняння фільтра статусу по нормалізованому значенню.
- `renderContacts` посилено:
- безпечне форматування дати (invalid date -> `-`);
- нормалізація `status` та `id` перед формуванням select;
- блокування select, якщо `id` невалідний, щоб не викликати status-update з некоректним ключем.
- `exportContactsCsv` уніфіковано на нормалізовані статуси (`new|in_progress|done`) для стабільного експорту.
- Додано helper `normalizeContactRequestStatus` і повторне використання його в `bulkUpdateContactStatus`.
