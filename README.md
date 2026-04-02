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

Language-aware read endpoints (Phase 1 i18n foundation):

- `GET /api/public?lang=uk|en`
- `GET /api/releases?lang=uk|en` (same for `artists`, `events`, `sponsors`)

When `lang` is missing or unsupported, backend falls back to default language (`uk`).

Production preflight guardrails are enforced on backend startup (`NODE_ENV=production`):

- `DATABASE_URL` must be set
- `CORS_ORIGIN` must not include `*`
- `DB_SSL=true` and one of: `DB_SSL_REJECT_UNAUTHORIZED=true` or `DB_SSL_ALLOW_SELF_SIGNED=true`
- `JWT_SECRET` must be strong and non-default (min 24 chars)
- `ADMIN_PASSWORD` must be strong and non-default (min 12 chars)
- `CONTACT_CAPTCHA_SECRET` is required when provider is `hcaptcha` or `recaptcha_v2`

## Frontend Setup

Serve project root with any static server (for example VS Code Live Server).

The frontend adapter mode is auto:

- if API is available, reads/writes through backend
- if API is unavailable, falls back to localStorage

## Admin Login Troubleshooting

If admin login fails, use this sequence:

1. Start backend and verify health:

```bash
cd backend
npm run dev
curl http://localhost:3000/api/health
```

1. Ensure DB schema and admin user exist:

```bash
cd backend
npm run migrate
npm run seed
```

1. Verify password source:

- backend uses `ADMIN_PASSWORD` from `backend/.env`
- default in `.env.example` is `core64admin`
- if password contains `#`, wrap value in quotes in `.env` (example: `ADMIN_PASSWORD="my#pass"`)
- login endpoint supports emergency auth via `ADMIN_PASSWORD` before DB lookup, so admin login can still work during temporary DB outages

1. Validate login endpoint directly:

```bash
export ADMIN_PASSWORD_FOR_TEST="<value-from-backend-.env-ADMIN_PASSWORD>"
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"'"$ADMIN_PASSWORD_FOR_TEST"'"}'
```

Expected:

- `200` with token: password and backend are OK
- `401` invalid credentials: wrong password
- `500` admin is not initialized: run migrate + seed

## Smoke Check (Public + Admin)

Run a one-shot smoke verification from project root:

```bash
node scripts/smoke-check.mjs
```

The script checks:

- `/api/health`
- `/api/health/db` (database connectivity)
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

Admin password source for smoke auth check:

- `CORE64_ADMIN_PASSWORD` (highest priority)
- `backend/.env` -> `ADMIN_PASSWORD` (auto-detected fallback)
- `core64admin` default (only if no value found above)

Runtime frontend API override (emergency troubleshooting):

- append `?apiBaseUrl=https://<your-api-domain>/api` to `index.html` or `admin.html`
- shorthand `?api=https://<your-api-domain>/api` is also supported
- override is persisted in browser localStorage for subsequent visits

Optional contact smoke-check is disabled by default.

Smoke mode notes:

- `CORE64_SMOKE_MODE=health` validates both `/api/health` and `/api/health/db`.
- Health mode now fails when DB connectivity is degraded (`DB_UNAVAILABLE`).
- Health mode output includes `checks.healthDb.hint` with an actionable remediation hint derived from `kind`/`dbCode`.

Release procedure and rollback checklist:

- See `RELEASE_RUNBOOK.md`
- See `BRANCH_PROTECTION_SETUP.md`
- See `GOOGLE_RUN_DEPLOYMENT.md`
- See `RELEASE_OWNERS_AND_ESCALATION.md`

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
- DB snapshot helper self-test (`scripts/test-print-db-target-snapshot.mjs`)
- DATABASE_URL policy helper self-test (`scripts/test-check-database-url-policy.mjs`)
- DATABASE_URL pooler sslmode helper self-test (`scripts/test-set-database-url-pooler-sslmode.mjs`)
- Cloud Run network hint helper self-test (`scripts/test-print-cloud-run-network-hint.mjs`)
- Cloud Run DB route verdict helper self-test (`scripts/test-print-cloud-run-db-route-verdict.mjs`)

Pre-release gate input validation:

- `core64_api_base` must start with `http://` or `https://`
- `core64_smoke_timeout_ms` must be integer `>= 1000`
- `core64_smoke_contact` must be `true` or `false`

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
- deterministic Node.js setup (`node-version: 20`) before runtime secret/config validation
- image push to Artifact Registry
- deploy to Cloud Run with production env and GCP Secret Manager references
- optional automatic post-deploy smoke-check against deployed service URL (health-only mode for release stability)
- fail-fast validation of Artifact Registry repo and required Secret Manager secrets
- post-failure diagnostics include Cloud Run networking annotations to inspect VPC/egress configuration during DB timeouts
- runtime config validation logs a safe DATABASE_URL target snapshot (protocol/host/port/database/sslmode only, no credentials)
- pre-migrate step logs a runtime TLS hint (`scripts/print-db-runtime-tls-hint.mjs`) with effective self-signed/libpq-compat semantics (safe metadata, no credentials)
- runtime config validation runs centralized DATABASE_URL policy helper (`scripts/check-database-url-policy.mjs --strict`) and fails fast on invalid format or unsupported pooler sslmode (allowed: `require`, `verify-ca`, `verify-full`) before Cloud Run rollout
- when strict policy fails on pooler sslmode, CI logs include a copy-ready idempotent remediation command that sets/replaces `sslmode=require` before `gcloud secrets versions add` (still fails fast; no policy relaxation)
- post-failure diagnostics also log the same safe DATABASE_URL target snapshot to correlate failed revision with DB endpoint metadata
- safe snapshot generation is centralized in `scripts/print-db-target-snapshot.mjs`
- post-failure diagnostics include a structured Cloud Run network routing hint generated by `scripts/print-cloud-run-network-hint.mjs`
- `/api/health/db` smoke output now includes safe DB target metadata (`host`/`port`/`database`/`sslmode`) and configured `DB_CONNECTION_TIMEOUT_MS` to correlate repeated timeout durations with runtime timeout settings
- pre-smoke deploy gate runs strict DB route compatibility verdict (`scripts/print-cloud-run-db-route-verdict.mjs --strict`) to fail fast on connector/egress mismatches and unsupported pooler sslmode (allowed: `require`, `verify-ca`, `verify-full`)

Required repository secret:

- `GCP_SA_KEY` (service account JSON for Artifact Registry + Cloud Run deploy)

Useful deploy inputs:

- `run_db_migrate` (default `true`)
- `run_db_seed` (default `false`)
- `run_post_deploy_smoke` (default `true`)
- `core64_smoke_timeout_ms` (default `60000`)
- `core64_smoke_retries` (default `3`)
- `core64_smoke_contact` (default `true`)
- `db_connection_timeout_ms` (default `15000`)
- `db_query_timeout_ms` (default `10000`)
- `db_statement_timeout_ms` (default `10000`)
- `auto_fix_pooler_sslmode` (default `false`) - if `true`, deploy may auto-update `DATABASE_URL` secret to `sslmode=require` for unsupported pooler sslmode before strict validation and verifies the updated latest secret value (enable via workflow_dispatch input when triggering the run)
  - requires Secret Manager write permission for the workflow identity (for example `roles/secretmanager.secretVersionAdder` on the target secret)
  - when `false` and strict policy detects unsupported pooler sslmode, workflow logs include copy-ready manual remediation commands using `scripts/set-database-url-pooler-sslmode.mjs`
- `require_release_owner_assignments` (default `true`)

Note: deploy workflow runs smoke in `health` mode (`CORE64_SMOKE_MODE=health`).
Use `.github/workflows/smoke-check.yml` or local `node scripts/smoke-check.mjs` for full post-release validation.

### Deploy Troubleshooting: unsupported_sslmode_for_pooler_endpoint

If deploy fails with strict DATABASE_URL policy reason `unsupported_sslmode_for_pooler_endpoint`, your `DATABASE_URL` points to a Supabase pooler endpoint (typically port `6543`) without an allowed `sslmode`.

Allowed pooler sslmodes:

- `require`
- `verify-ca`
- `verify-full`

Fast recovery options:

1. Re-run deploy workflow with input `auto_fix_pooler_sslmode=true`.
2. Apply manual remediation from workflow logs (copy-ready commands are printed when `auto_fix_pooler_sslmode=false`).
3. Update `DATABASE_URL` in Secret Manager manually by appending `sslmode=require` as a query parameter and creating a new secret version.

Manual one-shot remediation example:

```bash
CURRENT_DATABASE_URL="$(gcloud secrets versions access latest --project "core64records" --secret "DATABASE_URL")"
UPDATED_DATABASE_URL="$(DATABASE_URL_VALUE="$CURRENT_DATABASE_URL" DB_POOLER_SSLMODE="require" node scripts/set-database-url-pooler-sslmode.mjs --raw-url --strict)"
printf '%s' "$UPDATED_DATABASE_URL" | gcloud secrets versions add "DATABASE_URL" --project "core64records" --data-file=-
```

PowerShell one-shot remediation example (Windows):

```powershell
pwsh -NoProfile -File scripts/set-database-url-pooler-sslmode-secret.ps1 `
  -ProjectId "core64records" `
  -SecretName "DATABASE_URL" `
  -DesiredSslMode "require"
```

PowerShell dry-run preview (no Secret Manager write):

```powershell
pwsh -NoProfile -File scripts/set-database-url-pooler-sslmode-secret.ps1 `
  -ProjectId "core64records" `
  -SecretName "DATABASE_URL" `
  -DesiredSslMode "require" `
  -DryRun
```

Verify the latest secret passes strict policy before rerun:

```bash
DATABASE_URL_VALUE="$(gcloud secrets versions access latest --project "core64records" --secret "DATABASE_URL")" \
  node scripts/check-database-url-policy.mjs --strict
```

After updating the secret, re-run deploy.

## CI Rollback Google Run

GitHub Actions workflow is available at:

- `.github/workflows/rollback-google-run.yml`

It runs as manual rollback (`workflow_dispatch`) and performs:

- traffic rollback to selected (or auto-detected previous) Cloud Run revision
- fail-fast validation of required rollback secrets (`DATABASE_URL`, `ADMIN_PASSWORD`) before post-rollback smoke
- optional post-rollback smoke-check against deployed service URL (health mode with retries)
- post-failure rollback diagnostics include safe DATABASE_URL target snapshot and Cloud Run networking annotations
- post-failure rollback diagnostics also include a structured Cloud Run network routing hint from `scripts/print-cloud-run-network-hint.mjs`
- pre-smoke rollback gate runs strict DB route compatibility verdict (`scripts/print-cloud-run-db-route-verdict.mjs --strict`) before retries (including pooler sslmode validation: `require`, `verify-ca`, `verify-full`)
- pre-smoke rollback gate also prints strict DATABASE_URL policy verdict from `scripts/check-database-url-policy.mjs` (safe metadata, with remediation command output unless already printed in the manual-tip block)

Required repository secret:

- `GCP_SA_KEY`

Useful rollback inputs:

- `run_post_rollback_smoke` (default `true`)
- `database_url_secret_name` (default `DATABASE_URL`)
- `auto_fix_pooler_sslmode` (default `false`) - if `true`, rollback may auto-update `DATABASE_URL` secret to `sslmode=require` for unsupported pooler sslmode before strict pre-smoke verdict (enable via workflow_dispatch input when triggering the run)
  - requires Secret Manager write permission for the workflow identity (for example `roles/secretmanager.secretVersionAdder` on the target secret)
  - when `false` and strict policy detects unsupported pooler sslmode, workflow logs include copy-ready manual remediation commands using `scripts/set-database-url-pooler-sslmode.mjs`
- `core64_smoke_timeout_ms` (default `15000`)
- `core64_smoke_retries` (default `3`)
- `core64_smoke_contact` (default `false`)

Rollback input validation:

- boolean flags must be `true` or `false`
- `core64_smoke_timeout_ms` must be integer `>= 1000`
- `core64_smoke_retries` must be integer `>= 1`

## Local Unified Pre-Release Gate

Run both checks locally with one command:

```powershell
$env:GITHUB_TOKEN = "<github-pat-with-repo-admin-rights>"
pwsh -File scripts/pre-release-gate-local.ps1
```

This local gate runs:

- `scripts/test-print-db-target-snapshot.mjs`
- `scripts/test-check-database-url-policy.mjs`
- `scripts/test-set-database-url-pooler-sslmode.mjs`
- `scripts/test-print-cloud-run-network-hint.mjs`
- `scripts/test-print-cloud-run-db-route-verdict.mjs`
- `scripts/smoke-check.mjs`
- `scripts/verify-branch-protection.ps1`

Pre-deploy env sanity check for Google Run:

```powershell
pwsh -File scripts/check-google-run-env.ps1
```

The local env check uses the same centralized DATABASE_URL policy helper as CI (`scripts/check-database-url-policy.mjs`), so pooler sslmode validation is consistent (`require`, `verify-ca`, `verify-full`).

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
