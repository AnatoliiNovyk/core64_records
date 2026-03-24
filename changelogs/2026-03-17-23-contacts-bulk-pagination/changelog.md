# Changelog 2026-03-17 #23 - Масові дії та пагінація звернень

Адмінка підтримувала лише поодиноку зміну статусу звернення.
Список звернень рендерився без пагінації.

У `admin.html` додано кнопки масових дій:

- `new -> in_progress`
- `in_progress -> done`

У `admin.html` додано контейнер пагінації `contacts-pagination`.
У `admin.js` додано:

- state пагінації (`contactsPage`, `CONTACTS_PAGE_SIZE`),
- `changeContactsPage(delta)`,
- `bulkUpdateContactStatus(fromStatus, toStatus)`,
- пагінований рендер списку звернень.

Додало швидку масову обробку звернень.
Покращило продуктивність адмін-інтерфейсу на великих списках.
Підвищило керованість support-процесу.
