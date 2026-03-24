# Changelog 2026-03-17-39-audit-dynamic-filters-state-persistence

Added dynamic audit filter options generated from current audit dataset.
Added persistence of audit UI state in `sessionStorage`.
Kept pagination/search/filter behavior synchronized with saved state.

`admin.js`
`admin.html`

New persisted state fields:

- `search`
- `action`
- `entity`
- `limit`
- `refreshInterval`
- `page`

On page load, audit controls restore previous state from session.
Audit action/entity dropdowns now repopulate from distinct values in loaded logs.
Limit control now uses dedicated handler `changeAuditLimit()` with page reset.

`tokenOk=True; rows=5; actions=status_updated; entities=contact_request`
Static analysis: no errors in updated files.
