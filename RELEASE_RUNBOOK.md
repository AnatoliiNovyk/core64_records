# CORE64 Release Runbook

This runbook defines a minimal release process for CORE64 web + API.

Google Run + Supabase deployment playbook:

- See `GOOGLE_RUN_DEPLOYMENT.md`
- See `RELEASE_OWNERS_AND_ESCALATION.md`

## 1. Preconditions

- Repository is on `main` and up to date.
- Backend environment variables are configured.
- PostgreSQL is reachable.
- Frontend static server is available.
- Backend production env passes startup preflight:
	- `DB_SSL=true`
	- `DB_SSL_REJECT_UNAUTHORIZED=true`
	- non-default strong `JWT_SECRET`
	- non-default strong `ADMIN_PASSWORD`
	- `CORS_ORIGIN` without `*`

## 2. Start Services

From project root:

```bash
# terminal 1 (frontend static files)
python -m http.server 5500

# terminal 2 (backend API)
cd backend
npm start
```

Expected endpoints:

- Public/admin static: <http://localhost:5500>
- API: <http://localhost:3000/api>

## 3. Smoke Validation (Required)

From project root:

```bash
node scripts/smoke-check.mjs
```

The release is considered healthy only if output contains:

- `"passed": true`
- `health.status = 200`
- `public.status = 200`
- `admin.loginStatus = 200`
- `admin.meStatus = 200`
- `admin.settingsStatus = 200`
- no missing media in public payload
- no `static.photos` references
- no bad release links

Optional extended check:

- enable contact endpoint validation with `CORE64_SMOKE_CONTACT=true`
- expected status can be overridden with `CORE64_SMOKE_CONTACT_EXPECTED_STATUS`

CI alternative (single gate run):

- Run GitHub Actions workflow `Pre-Release Gate`.
- Provide `core64_api_base` and `core64_admin_password` inputs.
- Ensure repository secret `BRANCH_PROTECTION_TOKEN` is configured.
- Proceed only when workflow finishes successfully.

Local alternative (single gate command):

```powershell
$env:GITHUB_TOKEN = "<github-pat-with-repo-admin-rights>"
pwsh -File scripts/pre-release-gate-local.ps1
```

## 4. Manual UI Spot Check

- Open public page: <http://localhost:5500/index.html>
- Verify release card click opens exactly one destination tab.
- Verify Play button behavior is the same as card click.
- Verify images render in releases, artists, events, sponsors.
- Open admin page: <http://localhost:5500/admin.html>
- Login and verify dashboard/settings load without API error banner.

## 5. Go / No-Go Criteria

Go:

- Smoke check passed.
- Public + admin spot checks pass.
- No critical console/runtime errors.

No-Go:

- Smoke check fails.
- Auth/settings endpoints fail.
- Broken release navigation or major media rendering failure.

## 6. Rollback Procedure

### A. Code Rollback

```bash
git fetch origin
git log --oneline --max-count=20
git revert <bad_commit_sha>
git push
```

Use `git revert` (non-destructive) to create a rollback commit.

### B. Runtime Data Rollback (if needed)

If release links/images were updated via admin/API and must be reverted:

- Restore previous values from backup/export.
- Re-apply values via admin panel or authenticated API update.
- Re-run smoke check.

## 7. Post-Release Verification

After deployment:

- Re-run smoke checks against target API base:

```bash
CORE64_API_BASE=https://<your-domain>/api node scripts/smoke-check.mjs
```

- Submit one contact form request (expected 201) in target environment.
- Verify admin login and settings page once on deployed host.

## 8. Incident Notes Template

When a release fails, capture:

- Timestamp (UTC)
- Commit SHA
- Failed check(s)
- Impacted area (public/admin/contact)
- Rollback action taken
- Follow-up task
