# Batch 480 - Contacts Filter Apply Scheduler and Search Debounce

Added `contactsFilterDebounceTimer` runtime timer state for contacts filter apply scheduling.
Added `scheduleContactsFiltersApply(delayMs = 0)` helper:

- clears previous pending apply timers,
- captures section/navigation guards,
- validates contacts section/list connectivity before apply,
- normalizes controls via `getNormalizedContactsFilters()`,
- resets contacts page to first page,
- triggers `renderContacts()`.

Updated `handleContactsFilterChange()` to call `scheduleContactsFiltersApply(0)` for immediate applies.
Added `handleContactsSearchInput()` to call `scheduleContactsFiltersApply(250)` for debounced search applies.
Updated contacts search input event binding in `admin.html` from `handleContactsFilterChange()` to `handleContactsSearchInput()`.

Reduces render bursts and request-like churn while typing in contacts search field.
Preserves deterministic filter application with stale-navigation guards.
Keeps immediate behavior for status/date controls while making search input resilient under fast typing.

Diagnostics check for `admin.js`: no errors found.
Diagnostics check for `admin.html`: no errors found.
