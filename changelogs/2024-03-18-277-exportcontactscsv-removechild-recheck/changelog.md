# Change Log

Hardened `exportContactsCsv` with a final connectivity re-check before `removeChild` of the temporary download link.
Prevented detached-body/removal races after `link.click()` during rapid UI teardown scenarios.
Kept existing contacts CSV export behavior and URL cleanup intact.
