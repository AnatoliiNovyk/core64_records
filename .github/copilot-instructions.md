# CORE64 Records Project Guidelines

## Architecture
- Frontend is static files in repo root: `index.html`, `admin.html`, `app.js`, `admin.js`, `style.css`.
- Shared data access is in `data-adapter.js` (API-first with local fallback).
- Backend is in `backend/` (Node.js + Express + Firestore).
- API entrypoint is `backend/src/server.js`; route modules are mounted from `backend/src/routes/`.
- Collection CRUD routes are mounted as `/api/:type` (for example `/api/releases`, `/api/sponsors`).

## Build And Test
- Root UI smoke:
  - `npm run ui-smoke:install`
  - `npm run ui-smoke`
- Root API smoke:
  - `node scripts/smoke-check.mjs`
- Backend dev and data setup:
  - `cd backend && npm run dev`
- Local release gate:
  - `pwsh -File scripts/pre-release-gate-local.ps1`

## Conventions
- Keep DB/API field mapping consistent (`snake_case` in DB, `camelCase` in API payloads).
- Keep `year` as a string at UI/API boundaries for releases.
- Follow defensive DOM guards in `admin.js`: check element existence and `isConnected` before DOM reads/writes.
- In admin bootstrap flow, authentication check must happen before dashboard loading.
- After each implemented task, add a changelog file under `changelogs/`.
- Changelog format must include 3 sections: previous state, what was changed, and resulting improvement/fix/addition.

## Environment Pitfalls
- If `ADMIN_PASSWORD` contains `#`, wrap it in quotes in `.env`.
- In production, backend startup validates strict config (non-wildcard `CORS_ORIGIN`, strong secrets, Firestore backend mode).
- Frontend can override API base via query params: `?apiBaseUrl=...` (or shorthand `?api=...`).

## References
- Setup, architecture, smoke checks: `README.md`
- Deployment flow: `GOOGLE_RUN_DEPLOYMENT.md`
- Release process and rollback: `RELEASE_RUNBOOK.md`
- Release roles and escalation: `RELEASE_OWNERS_AND_ESCALATION.md`
- Branch protection setup: `BRANCH_PROTECTION_SETUP.md`
