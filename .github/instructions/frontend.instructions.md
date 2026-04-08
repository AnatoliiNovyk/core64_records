---
description: "Use when editing public/admin frontend files, UI data flow, adapter integration, DOM safety checks, and section settings behavior in CORE64."
name: "CORE64 Frontend Guidelines"
applyTo:
  - "admin.js"
  - "app.js"
  - "data-adapter.js"
  - "admin.html"
  - "index.html"
  - "style.css"
---

# CORE64 Frontend Guidelines

- Keep data flow API-first via data-adapter.js with local fallback behavior.
- Maintain defensive DOM access pattern used in admin.js:
  - Check element existence and isConnected before read/write operations.
  - Re-check target section/context after async calls when needed.
- In admin bootstrap logic, preserve auth-first sequence:
  - Run authentication check before dashboard loading.
- Keep UI and API contracts aligned for release data:
  - releases.year must remain string at UI and API boundaries.
- For new settings fields or section settings changes:
  - Keep admin and public behavior synchronized.
  - Verify persistence through settings bundle flow.
- Preserve existing UX fallback behavior for missing/partial API data instead of hard failures.

References:
- README.md
- RELEASE_RUNBOOK.md
