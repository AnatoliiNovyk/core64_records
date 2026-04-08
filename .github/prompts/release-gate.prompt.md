---
description: "Run and summarize CORE64 pre-release gate checks before deployment (API smoke, UI smoke, branch protection readiness)."
name: "CORE64 Pre-Release Gate"
argument-hint: "API base URL, admin password source, contact smoke on/off, branch protection token source"
agent: "agent"
---

Run a CORE64 pre-release validation and provide a concise release verdict.

Inputs to collect from user if missing:
- API base URL (for example http://localhost:3000/api or production API URL)
- admin password source
- whether contact smoke check should be enabled
- whether branch protection verification should run now

Execution workflow:
1. Validate required environment values when deployment-related checks are requested:
   - pwsh -File scripts/check-google-run-env.ps1
2. Run API smoke check:
   - node scripts/smoke-check.mjs
3. Run UI smoke check if browser smoke is required:
   - npm run ui-smoke:install
   - npm run ui-smoke
4. Run unified local gate when full release readiness is requested:
   - pwsh -File scripts/pre-release-gate-local.ps1

Output format:
- Verdict: GO or NO-GO
- Checks summary: passed, failed, skipped
- Critical blockers (if any)
- Recommended next action

Use repository references instead of duplicating procedures:
- RELEASE_RUNBOOK.md
- GOOGLE_RUN_DEPLOYMENT.md
- BRANCH_PROTECTION_SETUP.md
