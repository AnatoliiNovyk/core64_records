param(
    [Parameter(Mandatory = $false)]
    [string]$Core64ApiBase = "http://localhost:3000/api",

    [Parameter(Mandatory = $false)]
    [string]$Core64AdminPassword = "core64admin",

    [Parameter(Mandatory = $false)]
    [int]$Core64SmokeTimeoutMs = 15000,

    [Parameter(Mandatory = $false)]
    [bool]$Core64SmokeContact = $false,

    [Parameter(Mandatory = $false)]
    [string]$Owner = "AnatoliiNovyk",

    [Parameter(Mandatory = $false)]
    [string]$Repo = "core64_records",

    [Parameter(Mandatory = $false)]
    [string]$Branch = "main",

    [Parameter(Mandatory = $false)]
    [string[]]$ExpectedCheckContexts = @("smoke", "Smoke Check / smoke"),

    [Parameter(Mandatory = $false)]
    [int]$MinimumApprovals = 1,

    [Parameter(Mandatory = $false)]
    [ValidateSet("any", "true", "false")]
    [string]$ExpectedConversationResolution = "any",

    [Parameter(Mandatory = $false)]
    [string]$Token
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($Token)) {
    $Token = $env:GITHUB_TOKEN
}

if ([string]::IsNullOrWhiteSpace($Token)) {
    throw "GitHub token is missing. Set GITHUB_TOKEN env var or pass -Token for branch protection verification."
}

if ([string]::IsNullOrWhiteSpace($Core64ApiBase) -or ($Core64ApiBase -notmatch '^https?://')) {
    throw "Core64ApiBase must start with http:// or https://."
}

if ($Core64SmokeTimeoutMs -lt 1000) {
    throw "Core64SmokeTimeoutMs must be >= 1000."
}

if ($MinimumApprovals -lt 1 -or $MinimumApprovals -gt 6) {
    throw "MinimumApprovals must be between 1 and 6."
}

$ExpectedCheckContexts = @($ExpectedCheckContexts | ForEach-Object { $_.Trim() } | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique)
if ($ExpectedCheckContexts.Count -eq 0) {
    throw "ExpectedCheckContexts cannot be empty."
}

Write-Host "[1/8] Running DB snapshot helper self-test..."
node scripts/test-print-db-target-snapshot.mjs
if ($LASTEXITCODE -ne 0) {
    throw "DB snapshot helper self-test failed."
}

Write-Host "[2/8] Running DATABASE_URL policy helper self-test..."
node scripts/test-check-database-url-policy.mjs
if ($LASTEXITCODE -ne 0) {
    throw "DATABASE_URL policy helper self-test failed."
}

Write-Host "[3/8] Running DATABASE_URL pooler sslmode helper self-test..."
node scripts/test-set-database-url-pooler-sslmode.mjs
if ($LASTEXITCODE -ne 0) {
    throw "DATABASE_URL pooler sslmode helper self-test failed."
}

Write-Host "[4/8] Running Cloud Run network hint helper self-test..."
node scripts/test-print-cloud-run-network-hint.mjs
if ($LASTEXITCODE -ne 0) {
    throw "Cloud Run network hint helper self-test failed."
}

Write-Host "[5/8] Running Cloud Run DB route verdict helper self-test..."
node scripts/test-print-cloud-run-db-route-verdict.mjs
if ($LASTEXITCODE -ne 0) {
    throw "Cloud Run DB route verdict helper self-test failed."
}

Write-Host "[6/8] Running DB runtime TLS hint helper self-test..."
node scripts/test-print-db-runtime-tls-hint.mjs
if ($LASTEXITCODE -ne 0) {
    throw "DB runtime TLS hint helper self-test failed."
}

Write-Host "[7/8] Running smoke check..."
$env:CORE64_API_BASE = $Core64ApiBase
$env:CORE64_ADMIN_PASSWORD = $Core64AdminPassword
$env:CORE64_SMOKE_TIMEOUT_MS = [string]$Core64SmokeTimeoutMs
$env:CORE64_SMOKE_CONTACT = if ($Core64SmokeContact) { "true" } else { "false" }

node scripts/smoke-check.mjs
if ($LASTEXITCODE -ne 0) {
    throw "Smoke check failed."
}

Write-Host "[8/8] Running branch protection policy verification..."
& pwsh -NoProfile -File scripts/verify-branch-protection.ps1 `
    -Owner $Owner `
    -Repo $Repo `
    -Branch $Branch `
    -ExpectedCheckContexts $ExpectedCheckContexts `
    -MinimumApprovals $MinimumApprovals `
    -ExpectedConversationResolution $ExpectedConversationResolution `
    -Token $Token

if ($LASTEXITCODE -ne 0) {
    throw "Branch protection policy verification failed."
}

Write-Host "Pre-release local gate PASSED."
