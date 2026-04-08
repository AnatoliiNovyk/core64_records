---
description: "Run CORE64 post-deploy smoke checks and produce a concise release health summary for GO/NO-GO follow-up decisions."
name: "CORE64 Post-Deploy Smoke Summary"
argument-hint: "API base URL, admin password source, contact smoke expected status, timeout"
agent: "agent"
---

Run a post-deploy verification for CORE64 and return an operational summary.

If inputs are missing, ask for:
- target API base URL
- admin password source
- whether contact smoke should run
- expected status for contact smoke (if enabled)
- timeout override (optional)

Execution sequence:
1. Run API smoke check against target environment:
   - node scripts/smoke-check.mjs
2. If UI validation is requested, run browser smoke:
   - npm run ui-smoke:install
   - npm run ui-smoke

Output format:
- Verdict: HEALTHY or UNHEALTHY
- Environment: target API base URL
- Checks: health, healthDb, public payload, admin auth/settings, optional contact, optional ui-smoke
- Blocking issues: list only failures that require rollback or hotfix
- Recommended action: continue monitoring, hotfix, or rollback path

Use these references instead of duplicating procedures:
- RELEASE_RUNBOOK.md
- GOOGLE_RUN_DEPLOYMENT.md
- RELEASE_OWNERS_AND_ESCALATION.md
