# CORE64 Google Run Deployment Playbook

This document defines a practical production deployment flow for:

- Backend on Google Run
- Database on Supabase (fixed provider)

## 1. Required Inputs

Prepare the following values before deployment:

- `GCP_PROJECT_ID`
- `GCP_REGION`
- `GCP_SERVICE_NAME`
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
- Keep `run_post_deploy_smoke=true` for release runs.
- Keep `run_db_migrate=true` for release runs.
- Set `run_db_seed=true` only for first-time environment bootstrap.
- Workflow performs fail-fast input validation (no wildcard CORS, non-empty required secret names, valid boolean flags).
- Workflow validates Artifact Registry repository existence and required Secret Manager values before build/deploy.
- Workflow can enforce release-owner assignment readiness (`require_release_owner_assignments=true`).

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
docker build -f backend/Dockerfile -t $env:IMAGE_URI backend
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
  --set-env-vars "NODE_ENV=production,DB_SSL=true,DB_SSL_REJECT_UNAUTHORIZED=false,DB_SSL_ALLOW_SELF_SIGNED=true,CORS_ORIGIN=$env:CORS_ORIGIN,CONTACT_CAPTCHA_PROVIDER=$env:CONTACT_CAPTCHA_PROVIDER" `
  --set-secrets "DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest,ADMIN_PASSWORD=ADMIN_PASSWORD:latest,CONTACT_CAPTCHA_SECRET=CONTACT_CAPTCHA_SECRET:latest" `
  --port 3000 `
  --cpu 1 `
  --memory 512Mi `
  --concurrency 80 `
  --min-instances 0 `
  --max-instances 4
```

Note:

- Secret names in `--set-secrets` must exist in Secret Manager.
- Supabase pooled endpoints may require `DB_SSL_ALLOW_SELF_SIGNED=true` on CI/Cloud Run when full CA chain verification is unavailable in runner/container trust store.
- If captcha is disabled, keep `CONTACT_CAPTCHA_PROVIDER=none` and secret can be empty.
- Backend container source is `backend/Dockerfile`.

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
