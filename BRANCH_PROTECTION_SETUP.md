# Branch Protection Setup (main)

This document defines the recommended GitHub branch protection policy for `main`.

## Goal

Prevent direct unstable changes from reaching production by requiring smoke validation and review.

## Prerequisites

- Workflow exists: `.github/workflows/smoke-check.yml`
- Repository admins have access to Settings.
- At least one successful run of `Smoke Check` workflow exists in Actions history.

## Optional: Apply via Script

If you prefer API-based setup instead of UI clicks:

```powershell
$env:GITHUB_TOKEN = "<github-pat-with-repo-admin-rights>"
pwsh -File scripts/set-branch-protection.ps1
```

Script file: `scripts/set-branch-protection.ps1`

## Configure Rule

1. Open repository on GitHub.
2. Go to `Settings` -> `Branches`.
3. Under `Branch protection rules`, click `Add rule`.
4. Branch name pattern: `main`.

## Recommended Rule Options

Enable:

- `Require a pull request before merging`
- `Require approvals` (at least 1)
- `Dismiss stale pull request approvals when new commits are pushed`
- `Require status checks to pass before merging`
- `Require branches to be up to date before merging`
- `Do not allow bypassing the above settings` (optional, stricter)

## Required Status Checks

After at least one workflow run exists, add the smoke check context.

Use the check name visible in your Actions run UI, typically one of:

- `smoke`
- `Smoke Check / smoke`

If both appear, select the exact check context GitHub suggests in autocomplete.

## Optional Hardening

- Enable `Require conversation resolution before merging`.
- Enable `Require signed commits` if your team uses commit signing.
- Restrict who can push directly to `main`.

## Verification

1. Create a test PR with a harmless docs change.
2. Confirm PR shows required check `smoke` as pending/passed.
3. Confirm merge is blocked when the check fails.
4. Confirm direct push to `main` is blocked (if restriction enabled).

## Rollback

If protection blocks urgent hotfixes unexpectedly:

1. Temporarily uncheck strict options in the same branch rule.
2. Merge hotfix.
3. Re-enable protection and rerun smoke validation.
