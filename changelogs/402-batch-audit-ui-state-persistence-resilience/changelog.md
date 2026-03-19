# Batch 402: Audit UI State Persistence Resilience

## Як було
- `saveAuditUiState()` викликав `sessionStorage.setItem(...)` без `try/catch`.
- У браузерних обмеженнях (private mode, quota, policy restrictions) це могло кидати виняток і переривати поточний flow.

## Що зроблено
- У `saveAuditUiState()` обгорнуто `sessionStorage.setItem(...)` у `try/catch`.
- У `catch` додано контрольований `console.warn("Failed to persist audit UI state", error)`.

## Що покращило / виправило / додало
- Збереження audit UI state стало fail-safe.
- Навігаційні/refresh сценарії більше не падають через помилки storage persistence.

## Validation
- Diagnostics check for `admin.js`: **No errors found**.
