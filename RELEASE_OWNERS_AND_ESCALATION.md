# CORE64 Release Owners and Escalation

This document defines roles, responsibilities, and incident escalation for production releases.

## 1. Release Roles

- Release Commander: owns go/no-go decision and timeline.
- Deployer: runs deployment workflows and confirms completion.
- Verifier: runs smoke checks and manual UI verification.
- Database Owner: confirms migration safety and rollback implications.
- Communications Owner: posts status updates in agreed channel.

## 2. Named Assignments (Fill Before Release)

- Release Commander: `AnatoliiNovyk`
- Deployer: `AnatoliiNovyk`
- Verifier: `AnatoliiNovyk`
- Database Owner: `AnatoliiNovyk`
- Communications Owner: `AnatoliiNovyk`

## 3. Mandatory Checkpoints

1. Pre-release gate is green.
2. Deploy workflow completed without errors.
3. Post-deploy smoke passed.
4. Manual UI sanity checks passed.

Only Release Commander can announce final go/no-go.

## 4. Incident Severity and Escalation

- `SEV-1` (Production outage / auth failures / data corruption risk)
  - Immediate rollback workflow.
  - Notify all roles immediately.
  - Escalate to infrastructure owner and database owner.
- `SEV-2` (Major feature broken, partial degradation)
  - Evaluate rollback vs hotfix within 15 minutes.
  - Release Commander decides path.
- `SEV-3` (Minor issue, no release block)
  - Continue release if all critical checks are green.
  - Create follow-up task.

## 5. Communication Cadence

- T-30 min: release start notice.
- T-0: deployment started.
- T+10 min: post-deploy smoke status.
- T+20 min: final go/no-go announcement.

## 6. Rollback Trigger Conditions

Rollback is mandatory if any of the following is true:

- smoke check fails after deploy
- admin auth flow fails
- production API health is not `200`
- severe runtime errors in critical user path

Rollback command path:

- CI workflow: `.github/workflows/rollback-google-run.yml`
- Code rollback: `git revert <bad_commit_sha>` and redeploy
