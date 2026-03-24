# Changelog 2026-03-17 #18 - Admin contacts section

Звернення з публічної форми можна було лише записати, але не було адмін-перегляду.
API не мав окремого авторизованого читання `contact_requests`.

У backend додано `GET /api/contact-requests` (під `requireAuth`).
У `repository.js` додано `listContactRequests()` з сортуванням за датою.
У `data-adapter.js` додано `getContactRequests()`.
В `admin.html` додано пункт меню "Звернення" та секцію `section-contacts`.
В `admin.js` додано `loadContacts()` і інтеграцію в `showSection('contacts')`.

Додало повний цикл для контактних запитів: submit з публічної сторінки -> перегляд в адмінці.
Покращило операційну роботу: звернення більше не "губляться" без інтерфейсу читання.
Підвищило керованість контентом і підтримкою користувачів.
