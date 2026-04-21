# 2026-04-21-255 Admin Contacts Server Pagination and Filter Integration

## Як було

- Контакти в адмінці частково вже готувалися до metadata-first API, але рендер і взаємодії все ще значною мірою спиралися на локальний `filter/slice` по всьому масиву в `admin.js`.
- Перемикання сторінок і застосування фільтрів працювали як локальна операція UI, а не як джерело істини з бекенду.
- Після `change status` і `bulk update` список перезавантажувався без урахування нового server-side контракту, що могло давати неузгоджену поведінку для великих наборів даних.
- `CSV export` брав поточний локально відфільтрований набір, а не гарантовано повний server-side результат за активними фільтрами.

## Що зроблено

- У `admin.js` оновлено `loadContacts(options)`:
  - запитує `getContactRequests` з параметрами `returnMeta`, `page`, `limit`, `status`, `q`, `date`;
  - зчитує `{ items, page, limit, total }` та синхронізує `contactsPage`, `contactsTotal`, `cache.contactRequests`;
  - додано safe-retry, якщо поточна сторінка стала невалідною після фільтрів/оновлень.
- `renderContacts()` переведено на серверну модель:
  - прибрано локальний `slice`;
  - пагінація відображає сторінку від бекенду та загальну кількість (`total`).
- Оновлено сценарії взаємодії:
  - `changeContactsPage()` і `scheduleContactsFiltersApply()` тепер виконують `loadContacts()` замість локального ререндеру;
  - `changeContactStatus()` і `bulkUpdateContactStatus()` після мутацій виконують повний reload поточної server-side вибірки;
  - додано уніфіковану обробку `401` через `handleUnauthorizedSessionError()` у цих гілках.
- `exportContactsCsv()` зроблено асинхронним посторінковим експортом:
  - послідовно витягує всі сторінки за активними фільтрами (`status/q/date`);
  - формує CSV з повного server-side результату, а не лише з локального фрагмента.
- Проведено валідацію:
  - diagnostics для `admin.js`, `data-adapter.js`, `backend/src/routes/contactRequests.js`, `backend/src/db/repository.firestore.js` без помилок;
  - runtime перевірка `/api/contact-requests?page=1&limit=5` і `/api/contact-requests?page=1&limit=5&status=new` підтвердила meta-shape `data.items/page/limit/total`.

## Що покращило/виправило/додало

- Адмін-контакти тепер масштабуються через server-side pagination/filter без завантаження та локальної обробки всього масиву.
- Підвищено консистентність UI з API-контрактом: пагінація, фільтри, status-операції та експорт працюють від єдиного джерела істини.
- Зменшено ризик розсинхрону між відображенням у таблиці та реальними даними після мутацій.
- Експорт став передбачуваним для великих обсягів даних і точніше відображає активні серверні фільтри.
