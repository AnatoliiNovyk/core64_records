# Changelog 2026-03-17 #20 - Backend статуси звернень

API дозволяв створювати та читати звернення, але не підтримував зміну статусу.

Додано валідацію `contactRequestStatusSchema` (`new`, `in_progress`, `done`).
Додано репозиторний метод `updateContactRequestStatus(id, status)`.
Додано endpoint `PATCH /api/contact-requests/:id` (під auth) для оновлення статусу.

Додало повний життєвий цикл звернення (не лише read-only перегляд).
Виправило функціональний дефіцит support-flow у адмінці.
Підготувало базу для UI-контролів статусу і фільтрації.
