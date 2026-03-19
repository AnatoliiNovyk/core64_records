# Batch 391: Audit Exit Loading State Cleanup

## Як було
- При виході з audit секції викликався `cancelAuditRequest()`, але loading UI стан явно не скидався у цьому ж cleanup-блоці.
- Це залишало потенційне вікно для "висячого" loader/skeleton/`aria-busy` стану до наступного audit-входу.

## Що зроблено
- У `showSection` в non-audit cleanup гілці додано явний скидання loading state:
  - `setAuditLoading(false);`
- Виклик додано одразу після `cancelAuditRequest()`.

## Що покращило / виправило / додало
- Консистентний UI cleanup при виході з audit незалежно від стану in-flight запиту.
- Знижено ризик візуальних артефактів loader/skeleton після навігації між секціями.

## Validation
- Diagnostics check for `admin.js`: **No errors found**.
