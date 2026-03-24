# 458 Batch - Contacts pagination/filter normalization

як було:

- Contacts-flow мав базові guard-и, але числова та фільтр-нормалізація була неуніфікована.
- contactsPage міг отримувати нетипові значення через edge-case delta/state.
- status/date filter використовували сирі значення UI без централізованої валідації.
- Після change/bulk status update refetch-кеш контактів присвоювався без shape-нормалізації.

що зроблено:

- Додано константу CONTACTS_MIN_PAGE.
- Додано helper-и:
- normalizeContactsPage
- normalizeContactsStatusFilter
- normalizeIsoDateFilter
- getFilteredContacts:
- status filter переведено на normalizeContactsStatusFilter;
- date filter переведено на normalizeIsoDateFilter (тільки YYYY-MM-DD);
- query уніфіковано через String(...).trim().toLowerCase().
- renderContacts:
- contactsPage нормалізується через normalizeContactsPage;
- totalPages рахується з урахуванням CONTACTS_MIN_PAGE.
- changeContactsPage:
- delta проходить явну numeric/integer-валідацію;
- contactsPage оновлюється через normalizeContactsPage.
- changeContactStatus та bulkUpdateContactStatus:
- refetch contactRequests тепер проходить normalizeRecordArray перед cache assignment.

що покращило/виправило/додало:

- Усунуто залишкові edge-case для пагінації контактів (NaN/некоректний delta/state).
- Фільтри статусу/дати стали стабільнішими при невалідних UI-значеннях.
- Знижено ризик runtime-помилок після refetch контактів із неочікуваною структурою.
- Поведінка валідних сценаріїв збережена.
