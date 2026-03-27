# Branch Protection Setup (main)

This document defines the recommended GitHub branch protection policy for `main`.

## Goal

Prevent direct unstable changes from reaching production by requiring smoke validation and review.

## Prerequisites

- Workflow exists: `.github/workflows/smoke-check.yml`
- Workflow exists: `.github/workflows/branch-protection-verify.yml`
- Repository admins have access to Settings.
- At least one successful run of `Smoke Check` workflow exists in Actions history.
- Repository secret `BRANCH_PROTECTION_TOKEN` is configured for verification workflow.

## Optional: Apply via Script

If you prefer API-based setup instead of UI clicks:

```powershell
$env:GITHUB_TOKEN = "<github-pat-with-repo-admin-rights>"
pwsh -File scripts/set-branch-protection.ps1
```

Script file: `scripts/set-branch-protection.ps1`

Useful options:

- `-DryRun` to print payload without applying changes.
- `-CheckContext "smoke"` to target a specific required status check.
- `-SkipCheckContextValidation` if workflow checks are not yet visible on the branch.

Example dry run:

```powershell
pwsh -File scripts/set-branch-protection.ps1 -DryRun
```

Dry run does not require `GITHUB_TOKEN`.

Read current protection status (read-only):

```powershell
pwsh -File scripts/get-branch-protection.ps1
```

For full raw response:

```powershell
pwsh -File scripts/get-branch-protection.ps1 -AsJson
```

Verify policy with pass/fail output (exit code 0/1):

```powershell
pwsh -File scripts/verify-branch-protection.ps1
```

Verify using multiple accepted check context names:

```powershell
pwsh -File scripts/verify-branch-protection.ps1 -ExpectedCheckContexts "smoke","Smoke Check / smoke"
```

Optional stricter verification example (require conversation resolution):

```powershell
pwsh -File scripts/verify-branch-protection.ps1 -ExpectedConversationResolution true
```

GitHub Actions alternative:

- Run workflow `Branch Protection Verify` from Actions tab.
- Use inputs to match your policy.
- Input `expected_check_contexts` accepts comma-separated values.
- The workflow fails if policy does not match expected values.

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

1. Run emergency relax script:

```powershell
pwsh -File scripts/relax-branch-protection.ps1
```

2. Merge hotfix.
3. Re-apply protection with `scripts/set-branch-protection.ps1` and rerun smoke validation.
