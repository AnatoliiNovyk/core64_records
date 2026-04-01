# CORE64 Records

DB-first web app for CORE64 label with:

- public showcase page
- admin panel for content management
- API backend with PostgreSQL

## Architecture

- Frontend: static HTML + Tailwind CDN + Vanilla JS
- Data access: `data-adapter.js` (API-first, local fallback)
- Backend: Node.js + Express
- Database: PostgreSQL

## Project Structure

- `index.html` public website
- `admin.html` admin UI
- `app.js` public-page logic
- `admin.js` admin logic
- `data-adapter.js` shared API/local data adapter
- `backend/` Express API, DB migration, seed

## Backend Setup

1. Go to backend folder.
2. Install dependencies.
3. Create `.env` from `.env.example`.
4. Run migration and seed.
5. Start API server.

```bash
cd backend
npm install
cp .env.example .env
npm run migrate
npm run seed
npm run dev
```

API default URL: `http://localhost:3000/api`

Production preflight guardrails are enforced on backend startup (`NODE_ENV=production`):

- `DATABASE_URL` must be set
- `CORS_ORIGIN` must not include `*`
- `DB_SSL=true` and `DB_SSL_REJECT_UNAUTHORIZED=true`
- `JWT_SECRET` must be strong and non-default (min 24 chars)
- `ADMIN_PASSWORD` must be strong and non-default (min 12 chars)
- `CONTACT_CAPTCHA_SECRET` is required when provider is `hcaptcha` or `recaptcha_v2`

## Frontend Setup

Serve project root with any static server (for example VS Code Live Server).

The frontend adapter mode is auto:

- if API is available, reads/writes through backend
- if API is unavailable, falls back to localStorage

## Smoke Check (Public + Admin)

Run a one-shot smoke verification from project root:

```bash
node scripts/smoke-check.mjs
```

The script checks:

- `/api/health`
- `/api/public` payload quality (missing media, `static.photos`, bad release links)
- admin auth flow (`/api/auth/login`, `/api/auth/me`, `/api/settings`)

Optional environment overrides:

```bash
CORE64_API_BASE=http://localhost:3000/api
CORE64_ADMIN_PASSWORD=core64admin
CORE64_SMOKE_TIMEOUT_MS=10000
CORE64_SMOKE_CONTACT=false
CORE64_SMOKE_CONTACT_EXPECTED_STATUS=201
CORE64_SMOKE_CONTACT_CAPTCHA_TOKEN=
```

Optional contact smoke-check is disabled by default.

Release procedure and rollback checklist:

- See `RELEASE_RUNBOOK.md`
- See `BRANCH_PROTECTION_SETUP.md`
- See `GOOGLE_RUN_DEPLOYMENT.md`

Optional automation for GitHub branch protection:

```powershell
$env:GITHUB_TOKEN = "<github-pat-with-repo-admin-rights>"
pwsh -File scripts/set-branch-protection.ps1
```

Preview payload without applying changes:

```powershell
pwsh -File scripts/set-branch-protection.ps1 -DryRun
```

`-DryRun` can be executed without `GITHUB_TOKEN`.

Emergency rollback (temporarily relax required checks/reviews/admin enforcement):

```powershell
pwsh -File scripts/relax-branch-protection.ps1
```

Read current branch protection status:

```powershell
pwsh -File scripts/get-branch-protection.ps1
```

Raw API output:

```powershell
pwsh -File scripts/get-branch-protection.ps1 -AsJson
```

Verify branch protection policy with pass/fail exit code:

```powershell
pwsh -File scripts/verify-branch-protection.ps1
```

Verify with custom accepted check contexts:

```powershell
pwsh -File scripts/verify-branch-protection.ps1 -ExpectedCheckContexts "smoke","Smoke Check / smoke"
```

JSON verification output:

```powershell
pwsh -File scripts/verify-branch-protection.ps1 -AsJson
```

## CI Smoke Automation

GitHub Actions workflow is available at:

- `.github/workflows/smoke-check.yml`

It runs as a manual pre-release gate (`workflow_dispatch`) with inputs:

- `core64_api_base` (example: `https://your-domain/api`)
- `core64_admin_password`
- `core64_smoke_timeout_ms` (optional, default `15000`)
- `core64_smoke_contact` (optional, default `false`)

## CI Branch Protection Verification

GitHub Actions workflow is available at:

- `.github/workflows/branch-protection-verify.yml`

It runs manually (`workflow_dispatch`) and validates branch protection policy with pass/fail output.

Required repository secret:

- `BRANCH_PROTECTION_TOKEN` (GitHub PAT with permissions to read branch protection)

Common inputs:

- `owner`, `repo`, `branch`
- `expected_check_contexts` (default `smoke,Smoke Check / smoke`)
- `minimum_approvals` (default `1`)
- `expected_conversation_resolution` (`any`, `true`, or `false`)

## CI Unified Pre-Release Gate

GitHub Actions workflow is available at:

- `.github/workflows/pre-release-gate.yml`

It runs both checks in one run and returns a single release verdict:

- `smoke-check` (`scripts/smoke-check.mjs`)
- branch protection policy verification (`scripts/verify-branch-protection.ps1`)

For contact endpoint coverage, enable smoke contact check:

- CI input: `core64_smoke_contact=true`
- Local gate: `pwsh -File scripts/pre-release-gate-local.ps1 -Core64SmokeContact $true`

Required repository secret:

- `BRANCH_PROTECTION_TOKEN`

## CI Deploy to Google Run

GitHub Actions workflow is available at:

- `.github/workflows/deploy-google-run.yml`

It runs as manual deployment (`workflow_dispatch`) and performs:

- backend container build (`backend/Dockerfile`)
- image push to Artifact Registry
- deploy to Cloud Run with production env and GCP Secret Manager references
- optional automatic post-deploy smoke-check against deployed service URL
- fail-fast validation of Artifact Registry repo and required Secret Manager secrets

Required repository secret:

- `GCP_SA_KEY` (service account JSON for Artifact Registry + Cloud Run deploy)

Useful deploy inputs:

- `run_db_migrate` (default `true`)
- `run_db_seed` (default `false`)
- `run_post_deploy_smoke` (default `true`)
- `core64_smoke_timeout_ms` (default `15000`)
- `core64_smoke_contact` (default `true`)

## CI Rollback Google Run

GitHub Actions workflow is available at:

- `.github/workflows/rollback-google-run.yml`

It runs as manual rollback (`workflow_dispatch`) and performs:

- traffic rollback to selected (or auto-detected previous) Cloud Run revision
- optional post-rollback smoke-check against deployed service URL

Required repository secret:

- `GCP_SA_KEY`

## Local Unified Pre-Release Gate

Run both checks locally with one command:

```powershell
$env:GITHUB_TOKEN = "<github-pat-with-repo-admin-rights>"
pwsh -File scripts/pre-release-gate-local.ps1
```

This local gate runs:

- `scripts/smoke-check.mjs`
- `scripts/verify-branch-protection.ps1`

Pre-deploy env sanity check for Google Run:

```powershell
pwsh -File scripts/check-google-run-env.ps1
```

## Captcha Configuration

Contact form supports two providers:

- hCaptcha
- reCAPTCHA v2

Captcha is managed from admin settings and includes:

- enable/disable flag
- active provider
- site and secret keys for both providers
- allowed domain
- custom validation messages

Public API returns only safe captcha fields (no secret keys).

Optional environment fallback values (used when admin settings are not configured):

```dotenv
CONTACT_CAPTCHA_PROVIDER=none
CONTACT_CAPTCHA_SECRET=
```

## Auth Flow

- Admin login is performed via `POST /api/auth/login`
- Password is no longer stored in frontend settings data
- Token is stored in session storage and sent as Bearer token

## Day 1-2 Delivered

- API-first adapter added for public and admin pages
- Admin auth decoupled from public settings
- Contact form now stores requests through API endpoint (or local fallback)
- Backend skeleton with health/auth/CRUD/settings/contact routes
- PostgreSQL migration `001_init.sql`
- Seed script with admin user and initial content
