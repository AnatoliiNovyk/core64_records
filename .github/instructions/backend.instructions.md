---
description: "Use when editing backend API code, routes, Firestore repository logic, validation, or environment config in backend/. Includes contracts, safety checks, and release-critical conventions."
name: "CORE64 Backend Guidelines"
applyTo:
  - "backend/src/**"
  - "backend/.env*"
  - "backend/package.json"
---

# CORE64 Backend Guidelines

- Preserve API route mounting model from backend/src/server.js:
  - Route modules mounted under /api.
  - Collection CRUD contract is /api/:type.
- Keep DB to API mapping stable: snake_case in DB, camelCase in API payloads.
- Keep releases.year as string at API boundary.
- For schema or payload changes, update related parts in one batch:
  - Firestore repository mapping
  - validation schema
  - route and adapter contracts
- Keep production startup guardrails intact in backend/src/config.js:
  - strict CORS_ORIGIN
  - strong non-default secrets
  - Firestore backend mode validation
- When touching auth/admin bootstrap-sensitive backend endpoints, avoid behavior that can mask 401/503 diagnostics.
- Prefer defensive error handling consistent with current patterns:
  - validation errors as 400
  - DB connectivity failures as 503 with stable DB_UNAVAILABLE contract

References:
- README.md
- RELEASE_RUNBOOK.md
- GOOGLE_RUN_DEPLOYMENT.md
