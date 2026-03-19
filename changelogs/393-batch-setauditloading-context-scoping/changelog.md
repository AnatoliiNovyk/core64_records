# Batch 393: `setAuditLoading` Context Scoping

## Як було
- `setAuditLoading` змінював loader/list стани лише за наявністю DOM-елементів.
- Не було явної перевірки, що поточний контекст справді audit секція.

## Що зроблено
- У `setAuditLoading` додано ранні guard-умови:
  - `if (currentSection !== "audit") return;`
  - перевірка наявності й `isConnected` для `section-audit`.
- Після цього збережено поточну логіку перемикання loader/skeleton/list busy state.

## Що покращило / виправило / додало
- Зменшено ризик нецільових UI-мутацій від stale викликів поза audit-контекстом.
- Уніфіковано захист `setAuditLoading` з іншими audit helper-функціями.

## Validation
- Diagnostics check for `admin.js`: **No errors found**.
