## Як було
- У прод-адмінці (`dataMode: api`, `allowOfflineAdminAccess: false`) при збереженні EVENT адаптер міг переходити у local fallback, якщо API тимчасово недоступний.
- Після цього викликався `saveLocalData(...)`, і при переповненому `localStorage` користувач отримував помилку про browser storage/quota.
- Це маскувало реальну причину: запис у `api`-режимі не повинен був переходити в локальне сховище при вимкненому offline-доступі.

## Що зроблено
- У `data-adapter.js` змінено CRUD write-поведінку для `createItem`, `updateItem`, `deleteItem`:
  - у режимі `api` запит виконується напряму через API;
  - local fallback для запису дозволяється тільки коли `allowOfflineAdminAccess=true` і помилка належить до офлайн/мережевих/route/db-unavailable сценаріїв;
  - коли `allowOfflineAdminAccess=false`, помилка API повертається в UI без спроби запису в `localStorage`.
- В `admin.html` оновлено cache-bust версію скриптів до `2026-04-20-226` для примусового підхоплення нового JS у браузері.

## Що покращило / виправило / додало
- Усунуто падіння збереження EVENT у quota-помилку в `api`-режимі.
- Поведінка збереження стала консистентною з конфігом `allowOfflineAdminAccess=false`.
- Адмінка показує реальну API-причину, а не помилку переповнення браузерного сховища.
