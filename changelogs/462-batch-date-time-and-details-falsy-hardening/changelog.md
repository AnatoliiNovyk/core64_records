# 462 Batch - Date/time and details falsy hardening

- як було:
  - `formatDateTimeOrDash` трактував будь-яке falsy-значення як відсутнє, тому `0` (epoch timestamp) помилково відображався як `-`.
  - `safeSerializeDetails` для примітивів використовував `String(details || fallback)`, що втрачало `0`/`false`.
  - Поточний час у `audit-last-updated` та `addActivity` форматувався локально без спільного safe-helper.

- що зроблено:
  - `formatDateTimeOrDash`:
    - умову відсутності звужено до `null | undefined | ""`;
    - валідні числові timestamp (включно з 0) тепер обробляються коректно.
  - Додано `formatNowTimeOrFallback()`:
    - централізований safe-time helper з fallback `--:--:--`.
  - `safeSerializeDetails`:
    - для примітивів повертає `String(details)` без затирання `0`/`false` fallback-значенням.
  - `loadAuditLogs`:
    - `audit-last-updated` переведено на `formatNowTimeOrFallback()`.
  - `addActivity`:
    - timestamp переведено на `formatNowTimeOrFallback()`.

- що покращило/виправило/додало:
  - Усунуто тихі логічні перекоси для falsy-даних у форматуванні/серіалізації.
  - Зроблено консистентнішим відображення поточного часу в audit/activity UI.
  - Збережено сумісність для валідних стандартних сценаріїв.
