# Batch 473 - Contacts Filter Control Normalization and Handler Unification

## What changed
- Added `normalizeContactsStatusControlValue(statusFilterEl)` to canonicalize and sync `contacts-filter-status` control value.
- Added `normalizeContactsDateControlValue(dateFilterEl)` to canonicalize and sync `contacts-filter-date` control value.
- Added `getNormalizedContactsFilters()` to centralize normalized contacts filter retrieval (`status`, `date`, `query`).
- Updated `getFilteredContacts()` to consume centralized normalized filters instead of ad-hoc control reads.
- Added `handleContactsFilterChange()` that:
  - validates section/DOM connectivity,
  - normalizes filter controls,
  - resets pagination to first page,
  - triggers `renderContacts()`.
- Updated contacts filter controls in `admin.html` to use `handleContactsFilterChange()` for `status`, `date`, and `search` events.

## Why
- Keeps contacts filter values canonical and aligned with runtime filtering logic.
- Removes drift between filter controls and normalized state used in rendering/export.
- Ensures filter changes always reset pagination predictably to avoid stale page index behavior.

## Validation
- Diagnostics check for `admin.js`: no errors found.
- Diagnostics check for `admin.html`: no errors found.
