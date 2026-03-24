# Changelog 2026-03-17-41-audit-clear-filters

Added one-click reset for all audit filters in admin panel.
Ensured reset flow works with existing pagination and state persistence.

`admin.js`
`admin.html`

New button in audit header: `Очистити фільтри`
Reset behavior includes:

- search query
- action/entity filters
- date preset
- date range (`from` / `to`)
- page reset to `1`

Static checks: no errors in updated files.
API smoke: `tokenOk=True; items=5`
