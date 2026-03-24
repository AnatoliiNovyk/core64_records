# Batch 394: `setAuditLoading` Cleanup Regression Fix

Після попереднього hardening `setAuditLoading` робив ранній `return`, коли `currentSection !== "audit"`.
Це обмеження блокувало також `setAuditLoading(false)` у stale/exit сценаріях, через що loader міг лишатися у нескинутому стані до наступного входу в audit.

У `setAuditLoading` guard змінено з жорсткого секційного на умовний:

- `if (isLoading && currentSection !== "audit") return;`

Тобто:

- увімкнення loading (`true`) дозволено лише в активному audit-контексті;
- вимкнення loading (`false`) дозволено і поза active audit для коректного cleanup.

Усунуто ризик "завислого" loader/skeleton state після навігації.
Збережено безпечне обмеження для нецільового ввімкнення loading-підсистеми.

Diagnostics check for `admin.js`: **No errors found**.
