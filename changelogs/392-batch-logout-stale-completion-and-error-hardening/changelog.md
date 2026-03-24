# Batch 392: Logout Stale Completion and Error Hardening

`logout()` виконував `await adapter.logout(); location.reload();` без `try/catch`.
При помилці міг виникати unhandled rejection.
При пізньому завершенні logout після зміни контексту міг відбутися небажаний `location.reload()`.

У `logout()` додано:

- snapshot контексту: `sectionAtLogout`, `navigationSeqAtLogout`;
- `try/catch` навколо `await adapter.logout()`;
- перевірки `sectionNavigationSeq` і `currentSection` перед `location.reload()`;
- у `catch` — контрольований `console.error` і повідомлення користувачу через `alert`.

Прибрано ризик unhandled rejection у logout-флоу.
Зменшено ризик side-effect перезавантаження сторінки від stale async завершення.

Diagnostics check for `admin.js`: **No errors found**.
