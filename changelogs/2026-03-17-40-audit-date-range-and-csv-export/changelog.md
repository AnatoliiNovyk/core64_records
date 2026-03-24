# Changelog 2026-03-17-40-audit-date-range-and-csv-export

Added date range filtering for audit logs with quick presets.
Added CSV export for audit logs using current filter context.
Extended audit UI state persistence to include date filter values.

`admin.js`
`admin.html`

Preset period selector:

- `Увесь час`
- `Сьогодні`
- `Останні 24 години`
- `Останні 7 днів`
- `Кастомний`

Manual date range inputs:

- `Від дати`
- `До дати`

Export button:

- `Експорт CSV`

Date filters are applied together with search/action/entity filters.
Manual date input sets preset to `Кастомний` automatically.
Persisted in `sessionStorage`:

- `dateFrom`
- `dateTo`
- `datePreset`

`tokenOk=True; total=5; today=5`
Static analysis: no errors in updated files.
