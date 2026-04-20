# CORE64 Google Run Deployment Playbook

This document defines a practical production deployment flow for:

- Backend on Google Run
- Database on Google Firestore (only)

## 1. Required Inputs

Prepare the following values before deployment:

- `GCP_PROJECT_ID`
- `GCP_REGION`
- `GCP_SERVICE_NAME`
- `RUNTIME_SERVICE_ACCOUNT` (optional, default: `github-actions-deployer@<project>.iam.gserviceaccount.com`)
- `IMAGE_URI` (container image to deploy)
- `ARTIFACT_REPO` (Artifact Registry repo for container images)
- `IMAGE_TAG` (for example: git SHA, release tag)
- `FIRESTORE_PROJECT_ID` (usually equal to `GCP_PROJECT_ID`)
- `FIRESTORE_DATABASE_ID` (usually `(default)`)
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
- Workflow validates runtime config from Secret Manager values before deploy.
- Keep `run_post_deploy_smoke=true` for release runs.

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
  --set-env-vars "NODE_ENV=production,DATA_BACKEND=firestore,FIRESTORE_PROJECT_ID=$env:FIRESTORE_PROJECT_ID,FIRESTORE_DATABASE_ID=$env:FIRESTORE_DATABASE_ID,CORS_ORIGIN=$env:CORS_ORIGIN,CONTACT_CAPTCHA_PROVIDER=$env:CONTACT_CAPTCHA_PROVIDER" `
  --set-secrets "JWT_SECRET=JWT_SECRET:latest,ADMIN_PASSWORD=ADMIN_PASSWORD:latest" `
  --port 3000 `
  --cpu 1 `
  --memory 512Mi `
  --concurrency 80 `
  --min-instances 0 `
  --max-instances 4
```

If captcha is enabled, include captcha secret mapping in deploy command:

```powershell
--set-secrets "JWT_SECRET=JWT_SECRET:latest,ADMIN_PASSWORD=ADMIN_PASSWORD:latest,CONTACT_CAPTCHA_SECRET=CONTACT_CAPTCHA_SECRET:latest"
```

Notes:

- Secret names in `--set-secrets` must exist in Secret Manager.
- Runtime service account must have `roles/secretmanager.secretAccessor` on used secrets.
- Runtime service account must have Firestore read/write permissions for the selected project/database.
- `ADMIN_PASSWORD` in Secret Manager must be strong and at least 12 characters (`core64admin` is rejected in production).
- Keep `--no-use-http2` for Node/Express runtime to avoid upstream protocol reset errors from Cloud Run.
- Backend container source is `backend/Dockerfile`.

## 4. Post-Deploy Verification

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

## 5. Rollback

If critical checks fail:

1. Shift traffic to previous stable Google Run revision.
2. Revert bad code commit using `git revert` and redeploy.
3. Re-run smoke checks until green.

Manual CI rollback option:

- Run workflow `.github/workflows/rollback-google-run.yml`.
- Leave `target_revision` empty to auto-pick previous revision.
- Keep `run_post_rollback_smoke=true` to validate rollback.
