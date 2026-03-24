# 457 Batch - Audit numeric normalization

як було:

- У audit-flow частина числових значень (page/limit/refresh interval) читалась напряму з DOM/session state.
- Можливі NaN/negative/float-значення, що створювали нестабільність пагінації та інтервалів.

що зроблено:

- Додано константи меж для audit numeric-контролю:
- AUDIT_MIN_LIMIT
- AUDIT_MAX_LIMIT
- AUDIT_MAX_REFRESH_SECONDS
- Додано helper-и нормалізації:
- clampBoundedInteger
- normalizeAuditLimit
- normalizeAuditPage
- normalizeAuditRefreshSeconds
- saveAuditUiState:
- limit/refresh/page тепер зберігаються у нормалізованому вигляді.
- loadAuditUiState:
- limit/refresh/page відновлюються з примусовою нормалізацією.
- getAuditRefreshSeconds:
- повертає лише нормалізований інтервал (0 або валідне додатне ціле в межах).
- loadAuditLogs:
- limit нормалізовано перед запитом;
- auditTotal приводиться до невід’ємного числа;
- auditPage нормалізується з payload.
- changeAuditLimit:
- значення audit-limit в полі приводиться до нормалізованого перед reload.
- changeAuditPage:
- додано guard на валідний integer delta != 0;
- оновлення сторінки через normalizeAuditPage.
- renderAuditLogs:
- effectiveLimit і total нормалізовані;
- сторінка жорстко нормалізується перед рендером;
- у UI показується нормалізований total.

що покращило/виправило/додало:

- Усунуто NaN/negative/float-пастки в audit пагінації та автооновленні.
- Підвищено передбачуваність рендеру і state persistence для audit UI.
- Валідні сценарії залишились сумісними з попередньою поведінкою.
