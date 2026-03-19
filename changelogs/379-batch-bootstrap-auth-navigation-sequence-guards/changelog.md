# Batch 379: Bootstrap/Auth Navigation Sequence Guards

## Summary
Extended `sectionNavigationSeq` protection into bootstrap and auth flows so stale async results cannot mutate UI after newer navigation starts.

## Changes Applied

### 1) `DOMContentLoaded` Bootstrap Guarding
- Captured sequence at bootstrap start:
  - `const navigationSeqAtBootstrap = sectionNavigationSeq;`
- Added checks after async boundaries:
  - `await loadAuditLatencyThresholdsFromSettings()`
  - `await adapter.isApiAvailable()`
  - `await checkAuth()`
- Added sequence check in bootstrap catch before showing API status.

### 2) `checkAuth` Guarding
- Captured sequence:
  - `const navigationSeqAtAuth = sectionNavigationSeq;`
- Added post-await check after `await adapter.isAuthenticated()`.
- Prevents stale auth response from toggling login screen in a newer navigation context.

### 3) `handleLogin` Guarding
- Captured sequence:
  - `const navigationSeqAtLogin = sectionNavigationSeq;`
- Added post-await check after `await adapter.login(password)`.
- Added sequence check in catch path before error/UI handling.

## Validation
- Diagnostics check for `admin.js`: **No errors found**.

## Outcome
- Bootstrap and authentication UI mutations now respect active navigation generation.
- Reduced chance of stale login/bootstrap async completions affecting current UI state.
