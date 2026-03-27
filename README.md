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
```

Release procedure and rollback checklist:

- See `RELEASE_RUNBOOK.md`
- See `BRANCH_PROTECTION_SETUP.md`

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

## CI Smoke Automation

GitHub Actions workflow is available at:

- `.github/workflows/smoke-check.yml`

It runs as a manual pre-release gate (`workflow_dispatch`) with inputs:

- `core64_api_base` (example: `https://your-domain/api`)
- `core64_admin_password`
- `core64_smoke_timeout_ms` (optional, default `15000`)

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
