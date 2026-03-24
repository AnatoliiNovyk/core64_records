# Batch 378: Audit Navigation Sequence Guards

Extended stale-context protection to key audit async flows by checking `sectionNavigationSeq` across promise/await boundaries. This prevents stale callbacks from previous navigations from mutating UI after same-section roundtrips.

## Changes Applied

## 1) Keyboard Shortcut Refresh Flow Guarding

In `handleAuditKeyboardShortcuts`, captured:

- `const navigationSeqAtShortcut = sectionNavigationSeq;`

Added sequence checks in both `.then` and `.catch` paths before any UI updates/logging.
Outcome: shortcut-triggered completion cannot surface after a newer navigation started.

## 2) Manual Refresh (`refreshAuditNow`) Guarding

Captured:

- `const navigationSeqAtRefresh = sectionNavigationSeq;`

Added sequence checks in `catch` and `finally`.
In stale `finally`, reset loading state and exit early to avoid cooldown/UI side effects from old flow.

## 3) Force Refresh (`forceRefreshAuditNow`) Guarding

Captured:

- `const navigationSeqAtRefresh = sectionNavigationSeq;`

Added matching sequence checks in `catch` and `finally`.
In stale `finally`, reset loading state and skip cooldown/UI updates.

## 4) CSV Export Guarding

In `exportAuditCsv`, captured:

- `const navigationSeqAtExport = sectionNavigationSeq;`

Added sequence checks in `.then` and `.catch` before further DOM/UI actions.
Prevents old export callbacks from firing after a newer navigation context takes over.

Diagnostics check for `admin.js`: **No errors found**.

Audit async operations now consistently honor navigation generation, not only section string equality.
Reduced same-section roundtrip race effects in refresh/export UX.
