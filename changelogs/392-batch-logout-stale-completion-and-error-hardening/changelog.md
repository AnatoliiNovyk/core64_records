# Batch 392: Logout Stale Completion and Error Hardening

## Як було
- `logout()` виконував `await adapter.logout(); location.reload();` без `try/catch`.
- При помилці міг виникати unhandled rejection.
- При пізньому завершенні logout після зміни контексту міг відбутися небажаний `location.reload()`.

## Що зроблено
- У `logout()` додано:
  - snapshot контексту: `sectionAtLogout`, `navigationSeqAtLogout`;
  - `try/catch` навколо `await adapter.logout()`;
  - перевірки `sectionNavigationSeq` і `currentSection` перед `location.reload()`;
  - у `catch` — контрольований `console.error` і повідомлення користувачу через `alert`.

## Що покращило / виправило / додало
- Прибрано ризик unhandled rejection у logout-флоу.
- Зменшено ризик side-effect перезавантаження сторінки від stale async завершення.

## Validation
- Diagnostics check for `admin.js`: **No errors found**.
