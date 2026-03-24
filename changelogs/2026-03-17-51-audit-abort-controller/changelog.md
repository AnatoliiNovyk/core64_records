# Changelog - 2026-03-17 - Audit request cancellation via AbortController

Додано скасування попереднього audit-запиту перед запуском нового через `AbortController`.
Інтегровано скасування при виході з секції аудиту (`showSection`), щоб уникати зайвих in-flight запитів.
Додано безпечну обробку aborted-request (`AbortError`) без показу помилок користувачу.
Проброшено `signal` до fetch-рівня через data-adapter для методів audit.

Файл: `admin.js`

- Нові змінні/функції:
- `auditRequestController`
- `cancelAuditRequest()`
- `isAbortError(error)`
- Оновлено `loadAuditLogs()`:
- перед новим запитом скасовується попередній;
- створюється новий `AbortController`;
- `signal` передається в adapter;
- `AbortError` обробляється тихо.
- Оновлено `showSection(section)`:
- при переході з аудиту в іншу секцію викликається `cancelAuditRequest()`.

Файл: `data-adapter.js`

- `apiRequest(path, options)` тепер підтримує `options.signal`.
- `getAuditLogs(params, requestOptions)` передає `requestOptions.signal` у `apiRequest`.
- `getAuditFacets(requestOptions)` передає `requestOptions.signal` у `apiRequest`.

Статичні перевірки:

- `admin.js`: без помилок
- `data-adapter.js`: без помилок

Smoke API:

- `page=1; total=5; items=2`

Швидкі зміни фільтрів у журналі аудиту більше не тримають зайві паралельні запити.
Зменшено навантаження на мережу та бекенд під час активної взаємодії з фільтрами.
