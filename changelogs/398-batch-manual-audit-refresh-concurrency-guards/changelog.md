# Batch 398: Manual Audit Refresh Concurrency Guards

`refreshAuditNow` і `forceRefreshAuditNow` покладалися переважно на стан кнопок (`disabled`) і cooldown.
У вузькому race-сценарії конкурентного виклику до оновлення UI-стану другий виклик міг стартувати паралельно.

На вході обох функцій додано явний guard:

- `if (manualAuditRefreshInProgress) return false;`

Охоплено:

- `refreshAuditNow`
- `forceRefreshAuditNow`

Усунуто можливість паралельного запуску ручних audit refresh flow на рівні логіки, а не лише UI.
Знижено ризик дублюючих запитів/ефектів у граничних конкурентних сценаріях.

Diagnostics check for `admin.js`: **No errors found**.
