# Batch 476 - Contacts Search Control Normalization

Added `normalizeContactsSearchControlValue(searchEl)` helper to canonicalize and sync contacts search control value using Unicode `NFKC` normalization.
Updated `getNormalizedContactsFilters()` to read search input through `normalizeContactsSearchControlValue(...)`.
Updated contacts query construction in `getNormalizedContactsFilters()` to always use canonicalized search text.

Aligns contacts search normalization behavior with hardened audit search flow.
Reduces risk of inconsistent filtering caused by visually similar Unicode variants in user input.
Keeps contacts filter control values and runtime filter payload in sync.

Diagnostics check for `admin.js`: no errors found.
