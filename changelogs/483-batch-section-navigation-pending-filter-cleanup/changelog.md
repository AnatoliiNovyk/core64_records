# Batch 483 - Section Navigation Pending Filter Cleanup

Updated section transition logic in `showSection(section)` to use centralized timer cleanup helper for audit filters:

- replaced inline audit debounce timer reset with `cancelPendingAuditFiltersApply()`.

Added contacts pending-filter cleanup on section exit in `showSection(section)`:

- when navigating away from `contacts`, now calls `cancelPendingContactsFiltersApply()`.

Ensures pending delayed filter applies are consistently cancelled during section transitions.
Prevents stale contacts/audit debounce callbacks from firing after user navigates to another section.
Reuses centralized cleanup helpers for clearer, less duplicated transition logic.

Diagnostics check for `admin.js`: no errors found.
