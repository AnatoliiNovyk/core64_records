# Batch 393: `setAuditLoading` Context Scoping

`setAuditLoading` змінював loader/list стани лише за наявністю DOM-елементів.
Не було явної перевірки, що поточний контекст справді audit секція.

У `setAuditLoading` додано ранні guard-умови:

- `if (currentSection !== "audit") return;`
- перевірка наявності й `isConnected` для `section-audit`.

Після цього збережено поточну логіку перемикання loader/skeleton/list busy state.

Зменшено ризик нецільових UI-мутацій від stale викликів поза audit-контекстом.
Уніфіковано захист `setAuditLoading` з іншими audit helper-функціями.

Diagnostics check for `admin.js`: **No errors found**.
