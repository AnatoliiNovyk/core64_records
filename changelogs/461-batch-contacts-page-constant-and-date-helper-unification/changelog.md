# 461 Batch - Contacts page constant and date helper unification

- як було:
  - Після попередніх правок `CONTACTS_MIN_PAGE` опинилася в тілі `clampBoundedInteger`, а не у глобальному scope.
  - Це створювало runtime-ризик (`ReferenceError`) для `normalizeContactsPage` і всього contacts-pagination flow.
  - Частина date-formatting/file-date suffix логіки залишалась дубльованою локально.

- що зроблено:
  - Виправлено scope-дефект:
    - `CONTACTS_MIN_PAGE` перенесено в глобальні константи біля `CONTACTS_PAGE_SIZE`.
    - помилкову локальну декларацію видалено з `clampBoundedInteger`.
  - Додано helper `getTodayIsoDateSafe()`:
    - повертає безпечний ISO date suffix;
    - має fallback `unknown-date` для невалідного Date.
  - Уніфіковано використання date helper-ів:
    - `renderContacts` тепер використовує `formatDateTimeOrDash(createdAt)`.
    - `exportAuditCsv` filename -> `core64_audit_${getTodayIsoDateSafe()}.csv`.
    - `exportContactsCsv` filename -> `core64_contacts_${getTodayIsoDateSafe()}.csv`.

- що покращило/виправило/додало:
  - Усунуто критичний runtime-ризик у contacts-pagination.
  - Зменшено дублювання логіки форматування дат.
  - Експортні filename стали стабільнішими при аномаліях Date.
