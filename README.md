# CORE64 Records

CORE64 Records is a DB-first web app with:

- public showcase page
- admin panel for content management
- API backend on Node.js/Express
- Firestore as the only production data backend

## Architecture

- Frontend: static files in repo root (`index.html`, `admin.html`, `app.js`, `admin.js`, `style.css`)
- Shared data adapter: `data-adapter.js` (API-first with local fallback)
- Backend API: `backend/src/server.js` with route modules in `backend/src/routes/`
- Data backend: Firestore repository via `backend/src/db/repository.firestore.js`

## Project Structure

- `index.html`: public website
- `admin.html`: admin UI
- `app.js`: public-page behavior
- `admin.js`: admin behavior
- `data-adapter.js`: shared API/local data adapter
- `backend/`: API runtime and backend logic
- `scripts/`: smoke checks, release helpers, verification scripts
- `changelogs/`: task-by-task changelog entries

## Local Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Set Firestore runtime values in `backend/.env`:

```dotenv
DATA_BACKEND=firestore
FIRESTORE_PROJECT_ID=<your-gcp-project-id>
FIRESTORE_DATABASE_ID=core64recordsdb
```

If local ADC credentials are required, set:

```dotenv
GOOGLE_APPLICATION_CREDENTIALS=<absolute-path-to-service-account-json>
```

Start backend:

```bash
npm run dev
```

API base URL (default): `http://localhost:3000/api`

### 2. Frontend

Serve repository root with any static server (for example VS Code Live Server).

Adapter behavior:

- if API is reachable, frontend uses backend
- if API is unavailable, frontend falls back to localStorage

Runtime API override is supported from URL query params:

- `?apiBaseUrl=https://<your-api-domain>/api`
- shorthand: `?api=https://<your-api-domain>/api`

## Production Runtime Guardrails

On backend startup with `NODE_ENV=production`, validation enforces:

- `DATA_BACKEND=firestore`
- `CORS_ORIGIN` must not include `*`
- `JWT_SECRET` strong and non-default (min 24 chars)
- `ADMIN_PASSWORD` strong and non-default (min 12 chars)
- `CONTACT_CAPTCHA_SECRET` is required when captcha provider is `hcaptcha` or `recaptcha_v2`

## Admin Login Troubleshooting

1. Start backend and check health:

```bash
cd backend
npm run dev
curl http://localhost:3000/api/health
```

1. Verify password source:

- backend uses `ADMIN_PASSWORD` from `backend/.env`
- if password contains `#`, wrap value in quotes in `.env` (example: `ADMIN_PASSWORD="my#pass"`)

1. Validate login endpoint directly:

```bash
export ADMIN_PASSWORD_FOR_TEST="<value-from-backend-.env-ADMIN_PASSWORD>"
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"'"$ADMIN_PASSWORD_FOR_TEST"'"}'
```

Expected results:

- `200`: credentials and backend are OK
- `401`: invalid password
- `503`: backend auth/data dependency unavailable (check backend logs and Firestore access)

## Smoke Checks

From project root:

```bash
node scripts/smoke-check.mjs
```

Smoke validates core API/public/admin flows and supports optional contact check.

Useful env overrides:

```bash
CORE64_API_BASE=http://localhost:3000/api
CORE64_ADMIN_PASSWORD=core64admin
CORE64_SMOKE_TIMEOUT_MS=10000
CORE64_SMOKE_CONTACT=false
```

Health mode:

- `CORE64_SMOKE_MODE=health` validates both `/api/health` and `/api/health/db`
- fails when Firestore connectivity is degraded (`DB_UNAVAILABLE`)

### UI Smoke (Section Settings)

```bash
npm install
npm run ui-smoke:install
npm run ui-smoke
```

This validates admin/public section-settings synchronization through the browser UI.

## Deployment And Rollback

- Google Run deploy flow: `GOOGLE_RUN_DEPLOYMENT.md`
- Release checklist/process: `RELEASE_RUNBOOK.md`
- Release ownership/escalation: `RELEASE_OWNERS_AND_ESCALATION.md`
- Branch protection setup: `BRANCH_PROTECTION_SETUP.md`

## CI Workflows

- `.github/workflows/smoke-check.yml`: API smoke checks
- `.github/workflows/pre-release-gate.yml`: unified pre-release gate
- `.github/workflows/branch-protection-verify.yml`: branch protection verification
- `.github/workflows/deploy-google-run.yml`: Google Run deploy (Firestore-only)
- `.github/workflows/rollback-google-run.yml`: Google Run rollback (Firestore-only)

## Project Conventions

- Keep API payload fields in camelCase and storage fields consistent with backend mapping.
- Keep release `year` as string at UI/API boundaries.
- In `admin.js`, keep defensive DOM guards (`element && element.isConnected`) before DOM reads/writes.
- In admin bootstrap flow, auth check must happen before dashboard loading.
- After each implemented task, add a changelog file in `changelogs/` with:
  - previous state
  - what was changed
  - resulting improvement/fix/addition
