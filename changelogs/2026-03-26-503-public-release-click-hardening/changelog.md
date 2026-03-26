# 2026-03-26 — Public Release Click Hardening

## What changed

- Stabilized release card interactions on public page:
  - click on card opens release destination
  - click on Play button opens the same destination
  - keyboard activation added for release cards (Enter/Space)
- Fixed double-navigation issue where some browsers opened both popup and current tab.
- Added robust link fallback behavior for releases with missing/placeholder links.
- Added shared image fallback handling across public sections:
  - releases (`image`)
  - artists (`image`)
  - events (`image`)
  - sponsors (`logo`)
- Added repeatable smoke script:
  - `scripts/smoke-check.mjs`
  - verifies public payload quality and admin auth endpoints.
- Updated docs with smoke command and environment overrides.

## Why

Public UX had two critical issues:

1. Release clicks sometimes caused duplicate navigation due to popup handling differences.
2. External broken media URLs could degrade section rendering and make UI feel unreliable.

## Validation

- Manual runtime checks completed for release click behavior.
- Scripted checks passed using:

```bash
node scripts/smoke-check.mjs
```

- Smoke result:
  - health OK
  - public payload OK (no missing media, no `static.photos`, no bad release links)
  - admin login/me/settings OK.

## Notes

- Runtime content data in DB was normalized to remove placeholder release links and broken media dependencies.
- Existing fallback logic remains in frontend as safety net.
