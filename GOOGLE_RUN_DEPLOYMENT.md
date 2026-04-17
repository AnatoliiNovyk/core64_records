# CORE64 Google Run Deployment Playbook

This document defines a practical production deployment flow for:

- Backend on Google Run
- Database on Supabase (fixed provider)

## 1. Required Inputs

Prepare the following values before deployment:

- `GCP_PROJECT_ID`
- `GCP_REGION`
- `GCP_SERVICE_NAME`
- `RUNTIME_SERVICE_ACCOUNT` (optional, default: `github-actions-deployer@<project>.iam.gserviceaccount.com`)
- `IMAGE_URI` (container image to deploy)
- `ARTIFACT_REPO` (Artifact Registry repo for container images)
- `IMAGE_TAG` (for example: git SHA, release tag)
- `DATABASE_URL` (Supabase pooled/postgres connection string)
- `JWT_SECRET` (strong random secret)
- `ADMIN_PASSWORD` (strong random password)
- `CORS_ORIGIN` (production frontend domains, comma-separated)
- `CONTACT_CAPTCHA_PROVIDER` (`none`, `hcaptcha`, `recaptcha_v2`)
- `CONTACT_CAPTCHA_SECRET` (required when captcha provider is not `none`)

## 2. Pre-Deploy Validation

Run local pre-check for required env values:

```powershell
pwsh -File scripts/check-google-run-env.ps1
```

Before rotating `DATABASE_URL` to a new provider/cluster, run candidate DB preflight:

```powershell
$env:DATABASE_URL_VALUE = "postgresql://user:pass@host:5432/db?sslmode=require"
node scripts/check-postgres-cutover-readiness.mjs --strict
```

This verifies URL policy, DNS, and TCP reachability before deployment.

Ensure required GCP APIs are enabled once (Project Owner action):

```powershell
gcloud services enable run.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com cloudbuild.googleapis.com --project <project-id>
```

Run unified quality gate:

```powershell
$env:GITHUB_TOKEN = "<github-pat-with-repo-admin-rights>"
pwsh -File scripts/pre-release-gate-local.ps1 -Core64SmokeContact $true
```

## 3. Deploy Backend to Google Run

Manual CI option:

- Run workflow `.github/workflows/deploy-google-run.yml` from GitHub Actions.
- Required GitHub repository secret: `GCP_SA_KEY`.
- Workflow builds image, pushes to Artifact Registry, deploys to Cloud Run, and can run post-deploy smoke-check.
- Workflow validates production runtime config from Secret Manager before deploy (same rules as backend startup validation).
- Keep `run_post_deploy_smoke=true` for release runs.
- Keep `run_db_migrate=true` for release runs.
- Set `run_db_seed=true` only for first-time environment bootstrap.
- Workflow performs fail-fast input validation (no wildcard CORS, non-empty required secret names, valid boolean flags).
- Workflow validates Artifact Registry repository existence and required Secret Manager values before build/deploy.
- Workflow can enforce release-owner assignment readiness (`require_release_owner_assignments=true`).
- Optional workflow input `cutover_candidate_database_url` runs strict candidate DB preflight (`check-postgres-cutover-readiness.mjs --strict`) before runtime config validation and migrations.
- Pre-flight order in workflow is fixed and intentional:
  1. Validate deploy inputs and release-owner assignment readiness.
  2. Validate Artifact Registry repository and required Secret Manager values.
  3. Run optional candidate DB preflight when `cutover_candidate_database_url` is provided.
  4. Validate runtime config and continue with migrate/seed/deploy steps.

Set deployment variables in your shell:

```powershell
$env:GCP_PROJECT_ID = "<project-id>"
$env:GCP_REGION = "<region>"
$env:GCP_SERVICE_NAME = "core64-api"
$env:ARTIFACT_REPO = "core64"
$env:IMAGE_TAG = "<release-tag-or-sha>"
$env:IMAGE_URI = "$env:GCP_REGION-docker.pkg.dev/$env:GCP_PROJECT_ID/$env:ARTIFACT_REPO/core64-backend:$env:IMAGE_TAG"
```

Build and push container image (from repository root):

```powershell
docker build -f backend/Dockerfile -t $env:IMAGE_URI .
docker push $env:IMAGE_URI
```

Deploy revision:

```powershell
gcloud run deploy $env:GCP_SERVICE_NAME `
  --project $env:GCP_PROJECT_ID `
  --region $env:GCP_REGION `
  --image $env:IMAGE_URI `
  --platform managed `
  --allow-unauthenticated `
  --no-use-http2 `
  --service-account $env:RUNTIME_SERVICE_ACCOUNT `
  --set-env-vars "NODE_ENV=production,DB_SSL=true,DB_SSL_REJECT_UNAUTHORIZED=false,DB_SSL_ALLOW_SELF_SIGNED=true,CORS_ORIGIN=$env:CORS_ORIGIN,CONTACT_CAPTCHA_PROVIDER=$env:CONTACT_CAPTCHA_PROVIDER" `
  --set-secrets "DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest,ADMIN_PASSWORD=ADMIN_PASSWORD:latest" `
  --port 3000 `
  --cpu 1 `
  --memory 512Mi `
  --concurrency 80 `
  --min-instances 0 `
  --max-instances 4
```

To enable VPC connector routing for private database endpoints, add `--vpc-connector` and `--vpc-egress`:

```powershell
$env:VPC_CONNECTOR = "projects/<project-id>/locations/<region>/connectors/<connector-name>"

gcloud run deploy $env:GCP_SERVICE_NAME `
  --project $env:GCP_PROJECT_ID `
  --region $env:GCP_REGION `
  --image $env:IMAGE_URI `
  --platform managed `
  --allow-unauthenticated `
  --no-use-http2 `
  --service-account $env:RUNTIME_SERVICE_ACCOUNT `
  --set-env-vars "NODE_ENV=production,DB_SSL=true,DB_SSL_REJECT_UNAUTHORIZED=false,DB_SSL_ALLOW_SELF_SIGNED=true,CORS_ORIGIN=$env:CORS_ORIGIN,CONTACT_CAPTCHA_PROVIDER=$env:CONTACT_CAPTCHA_PROVIDER" `
  --set-secrets "DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest,ADMIN_PASSWORD=ADMIN_PASSWORD:latest" `
  --port 3000 `
  --cpu 1 `
  --memory 512Mi `
  --concurrency 80 `
  --min-instances 0 `
  --max-instances 4 `
  --vpc-connector $env:VPC_CONNECTOR `
  --vpc-egress private-ranges-only
```

To update VPC egress on an existing service without redeploying:

```powershell
gcloud run services update core64-api `
  --project core64records `
  --region europe-west1 `
  --vpc-egress private-ranges-only
```

Note:

- Secret names in `--set-secrets` must exist in Secret Manager.
- Runtime service account must have `roles/secretmanager.secretAccessor` on used secrets.
- `ADMIN_PASSWORD` in Secret Manager must be strong and at least 12 characters (`core64admin` is rejected in production).
- Keep `--no-use-http2` for Node/Express runtime to avoid upstream protocol reset errors from Cloud Run.
- Supabase pooled endpoints may require `DB_SSL_ALLOW_SELF_SIGNED=true` on CI/Cloud Run when full CA chain verification is unavailable in runner/container trust store.
- If captcha is disabled, keep `CONTACT_CAPTCHA_PROVIDER=none`; do not bind `CONTACT_CAPTCHA_SECRET` in deploy command.
- Backend container source is `backend/Dockerfile`.
- When using a VPC connector with `--vpc-egress private-ranges-only`, only traffic to private IP ranges (RFC 1918) is routed through the connector; public traffic exits directly. Use `all-traffic` to route all outbound traffic through the connector.

Cutover troubleshooting:

- If deploy fails at `Validate GCP resources and secrets`, the candidate preflight step is not executed. Resolve GCP prerequisites first (`gcp_project_id`, `gcp_region`, `artifact_repo`, Secret Manager access).
- For `core64records`, the expected Artifact Registry settings are `artifact_repo=core64` and `gcp_region=europe-west1`.
- If deploy reaches `Run candidate Postgres cutover preflight` and fails, inspect DNS/TCP reachability for candidate DB host/port before any runtime cutover.

## 4. Database Migration (Supabase)

Before traffic cutover, run migration against production Supabase:

```powershell
cd backend
npm run migrate
```

If initial environment requires seed data:

```powershell
npm run seed
```

## 5. Post-Deploy Verification

Run smoke check against production API:

```powershell
$env:CORE64_API_BASE = "https://<your-api-domain>/api"
$env:CORE64_ADMIN_PASSWORD = "<admin-password>"
$env:CORE64_SMOKE_CONTACT = "true"
node scripts/smoke-check.mjs
```

Success criteria:

- `passed = true`
- `health/public/admin` checks are green
- optional `contact` check is green when enabled

## 6. Rollback

If critical checks fail:

1. Shift traffic to previous stable Google Run revision.
2. Revert bad code commit using `git revert` and redeploy.
3. Re-run smoke checks until green.

Manual CI rollback option:

- Run workflow `.github/workflows/rollback-google-run.yml`.
- Leave `target_revision` empty to auto-pick previous revision.
- Keep `run_post_rollback_smoke=true` to validate rollback.
- Optional workflow input `cutover_candidate_database_url` runs strict candidate DB preflight (`check-postgres-cutover-readiness.mjs --strict`) before rollback smoke.
