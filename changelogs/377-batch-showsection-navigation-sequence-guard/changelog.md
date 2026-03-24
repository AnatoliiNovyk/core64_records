# Batch 377: `showSection` Navigation Sequence Guard

Added a monotonic navigation sequence guard to `showSection` so stale async completions from earlier navigation attempts cannot mutate UI state after newer section transitions, including same-section roundtrips.

## Changes Applied

## 1) Added Navigation Sequence State

Introduced global state:

- `let sectionNavigationSeq = 0;`

Purpose: uniquely identify the currently active `showSection` invocation.

## 2) Captured Invocation Token in `showSection`

At function start, captured and incremented:

- `const sectionNavigationSeqAtStart = ++sectionNavigationSeq;`

This token is used to verify liveness after async boundaries.

## 3) Guarded Post-Modal and Post-Save Continuation

Added sequence checks after:

- `await showSettingsUnsavedNavigationModal()`
- `await saveSettings({ notifySuccess: false })`

Prevents old navigation flow from continuing if a newer navigation started meanwhile.

## 4) Guarded Section Load Await Chain

Added sequence checks after each awaited section loader branch in `showSection`:

- `loadDashboard`, `loadReleases`, `loadArtists`, `loadEvents`, `loadSettings`, `loadContacts`, `loadAuditLogs`.

Added additional sequence checks before final success handling and inside catch path.

Diagnostics check for `admin.js`: **No errors found**.

`showSection` is now robust against stale async completions even when section value cycles back to the same string.
Reduced risk of out-of-order UI updates during rapid user navigation.
