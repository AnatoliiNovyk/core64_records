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

if ($MinimumApprovals -lt 1 -or $MinimumApprovals -gt 6) {
    throw "MinimumApprovals must be between 1 and 6."
}

$ExpectedCheckContexts = @($ExpectedCheckContexts | ForEach-Object { $_.Trim() } | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique)
if ($ExpectedCheckContexts.Count -eq 0) {
    throw "ExpectedCheckContexts cannot be empty."
}

Write-Host "[1/2] Running smoke check..."
$env:CORE64_API_BASE = $Core64ApiBase
$env:CORE64_ADMIN_PASSWORD = $Core64AdminPassword
$env:CORE64_SMOKE_TIMEOUT_MS = [string]$Core64SmokeTimeoutMs
$env:CORE64_SMOKE_CONTACT = if ($Core64SmokeContact) { "true" } else { "false" }

node scripts/smoke-check.mjs
if ($LASTEXITCODE -ne 0) {
    throw "Smoke check failed."
}

Write-Host "[2/2] Running branch protection policy verification..."
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
