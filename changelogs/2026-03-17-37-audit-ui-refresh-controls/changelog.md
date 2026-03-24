# Changelog 2026-03-17-37-audit-ui-refresh-controls

Added manual refresh and auto-refresh controls to admin audit section.
Added visual indicators for refresh mode and last update time.
Added timer lifecycle handling to avoid running audit refresh outside audit section.

`admin.html`
`admin.js`

Button: `Оновити зараз`
Select: `Автооновлення` (`Вимкнено`, `10с`, `20с`, `30с`)
Status labels:

- `Автооновлення: ...`
- `Оновлено: HH:MM:SS`

End-to-end audit flow after changes:

- `createdId=9; found=True; actor=admin; status=done`
