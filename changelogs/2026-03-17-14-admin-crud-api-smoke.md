# Changelog 2026-03-17 #14 - Admin CRUD API end-to-end smoke

## Як було
- Після переходу адмінки в API-only режим потрібно було підтвердити, що CRUD реально працює наскрізно.

## Що було зроблено
- Запущено backend (`npm run dev`).
- Виконано авторизований CRUD-цикл для `releases`:
  - `POST /api/auth/login` (отримано token),
  - `POST /api/releases` (create),
  - `PUT /api/releases/:id` (update),
  - `DELETE /api/releases/:id` (delete),
  - `GET /api/releases` (list).
- Отримано позитивний результат циклу: `createdId=2; updatedTitle=Test Release API Updated; listCount=1`.

## Що це покращило, виправило, додало
- Підтвердило, що адмінні операції API працюють end-to-end з авторизацією.
- Підтвердило готовність поточного етапу до ручного UI-тесту в браузері.
- Закрило ключовий ризик інтеграції між адмін-логікою та backend CRUD.
