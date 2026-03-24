# 463 Batch - Local date key unification for filters

як було:

- Contacts date-filter порівнював дату через `String(createdAt).slice(0, 10)`, що нестабільно для `Date`/timestamp/нестандартних рядків.
- `getTodayIsoDateSafe` формував дату через `toISOString`, що може давати UTC-зсув від локальної дати.
- `toDateInputValue` дублював локальне форматування окремою реалізацією.

що зроблено:

- Додано helper-и:
- `formatDateToLocalIso(date, fallback)` — локальний `YYYY-MM-DD` із валідацією.
- `getDateFilterKey(value)` — уніфікований key для фільтра (string/Date/timestamp).
- `getTodayIsoDateSafe` переведено на `formatDateToLocalIso(now, "unknown-date")`.
- `getFilteredContacts`:
- date-match переведено на `createdDateKey = getDateFilterKey(createdAt)`;
- порівняння з фільтром тепер стабільне для різних форматів дати.
- `toDateInputValue` переведено на shared helper `formatDateToLocalIso(date, "")`.

що покращило/виправило/додало:

- Підвищено коректність date-filter у contacts для реальних різноформатних payload.
- Прибрано ризик UTC/local date drift у filename/date key сценаріях.
- Зменшено дублювання date-formatting логіки.
