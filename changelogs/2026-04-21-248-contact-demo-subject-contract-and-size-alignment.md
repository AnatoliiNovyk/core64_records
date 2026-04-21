## Як було
- Логіка визначення demo-запиту орієнтувалась переважно на локалізований текст теми, через що в EN-сценаріях можливі хибні перевірки обов'язкового файлу.
- Frontend і backend мали розрив по ліміту вкладення: UI допускав до 15 MB, а backend обмежував `attachmentDataUrl` нижчим символьним порогом.
- Після `PATCH /contact-requests/:id` відповідь могла повертати іншу форму attachment-даних для chunked-вкладень, ніж `GET /contact-requests`.
- `listContactRequests` завжди намагався гідрувати attachment, навіть коли вкладення inline, що зайво навантажувало читання.

## Що зроблено
- У `index.html` для тем звернення додано стабільні `value` (`demo_recording`, `cooperation`, `event`, `other`) при збереженні локалізованих підписів.
- У `app.js`:
  - розширено `isDemoSubject(...)` для підтримки стабільних кодів і EN/UK варіантів;
  - додано передачу `subjectCode` у payload, а `subject` лишається людиночитним текстом з обраної опції;
  - вирівняно ліміт завантаження файлу через backend-compatible clamp, щоб UI не пропускав файл, який backend відхиляє.
- У `data-adapter.js` додано прокидання `subjectCode` в `submitContactRequest(...)`.
- У `backend/src/middleware/validate.js`:
  - додано `subjectCode` в schema;
  - замінено жорстке `attachmentDataUrl.max(15_000_000)` на розрахунковий ліміт з 15 MB (`base64 + префікс`), узгоджений з UI;
  - уніфіковано demo-детекцію через `subjectCode` з fallback на текст теми.
- У `backend/src/db/repository.firestore.js`:
  - додано підтримку `subjectCode` в мапінгу API і storage;
  - оптимізовано `listContactRequests`: гідрація attachment виконується лише для chunked-вкладень;
  - виправлено `updateContactRequestStatus`: повертається консистентний attachmentDataUrl (гідрований для chunked), як і в `listContactRequests`.

## Що покращило/виправило/додало
- Виправлено нестабільну перевірку demo-запиту в EN/UK сценаріях.
- Усунуто розрив контракту за максимальним розміром вкладення між frontend та backend.
- Зроблено консистентним контракт відповіді для contact requests після status update.
- Зменшено зайві читання при списковому завантаженні contact requests для inline-вкладень.
