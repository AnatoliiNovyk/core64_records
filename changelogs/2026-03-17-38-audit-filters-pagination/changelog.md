# Changelog 2026-03-17-38-audit-filters-pagination

Enhanced admin audit section with client-side filtering and pagination.
Added dedicated filters by action and entity type.
Added audit pagination controls with page reset on filter/search change.

`admin.js`
`admin.html`

New filters:

- `Фільтр за дією` (all/status_updated)
- `Фільтр за сутністю` (all/contact_request)

Search now resets audit page to first page.
Added `audit-pagination` controls:

- `Назад`
- `Сторінка X з Y`
- `Вперед`

`tokenOk=True; total=5; statusUpdated=5; contactEntity=5`
