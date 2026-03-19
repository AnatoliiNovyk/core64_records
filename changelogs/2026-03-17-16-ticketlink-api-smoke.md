# Changelog 2026-03-17 #16 - TicketLink API smoke success

## Як було
- Після додавання `ticketLink` у форму та рендер потрібно було підтвердити наскрізну роботу через API.

## Що було зроблено
- Запущено backend (`npm run dev`).
- Через API виконано сценарій:
  - login,
  - create event з `ticketLink`,
  - read через `/api/public`,
  - delete тестової події.
- Результат: `createdId=2; ticketLink=https://example.com/tickets/qa-event; hasLink=True`.

## Що це покращило, виправило, додало
- Підтвердило, що ticket URL зберігається в БД та повертається в публічний payload.
- Підтвердило готовність фронтенду відображати робочу кнопку "Квитки" на основі даних API.
- Зняло ризик розриву між адмін-даними та публічним рендером для квитків.
