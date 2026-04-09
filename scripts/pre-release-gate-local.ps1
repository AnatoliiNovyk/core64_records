param(
    [Parameter(Mandatory = $false)]
    [string]$Core64ApiBase = "http://127.0.0.1:3000/api",

    [Parameter(Mandatory = $false)]
    [string]$Core64AdminPassword = "core64admin",

    [Parameter(Mandatory = $false)]
    [int]$Core64SmokeTimeoutMs = 15000,

    [Parameter(Mandatory = $false)]
    [bool]$Core64SmokeContact = $false,

    [Parameter(Mandatory = $false)]
    [bool]$Core64SmokeRateLimitCheck = $true,

    [Parameter(Mandatory = $false)]
    [int]$Core64SmokeRateLimitAttempts = 25,

    [Parameter(Mandatory = $false)]
    [int]$Core64SmokeRateLimitCollectionsAttempts = 35,

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
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $repoRoot

function Get-BackendEnvValue {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Key,

        [Parameter(Mandatory = $true)]
        [string]$EnvPath
    )

    if (-not (Test-Path -LiteralPath $EnvPath)) {
        return ""
    }

    $lines = Get-Content -LiteralPath $EnvPath
    foreach ($line in $lines) {
        $trimmed = $line.Trim()
        if (-not $trimmed -or $trimmed.StartsWith("#")) {
            continue
        }

        $match = [regex]::Match($trimmed, '^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$')
        if (-not $match.Success) {
            continue
        }

        if ($match.Groups[1].Value -ne $Key) {
            continue
        }

        $rawValue = $match.Groups[2].Value.Trim()
        if (-not $rawValue) {
            return ""
        }

        $isDoubleQuoted = $rawValue.Length -ge 2 -and $rawValue.StartsWith('"') -and $rawValue.EndsWith('"')
        $isSingleQuoted = $rawValue.Length -ge 2 -and $rawValue.StartsWith("'") -and $rawValue.EndsWith("'")
        if ($isDoubleQuoted -or $isSingleQuoted) {
            return $rawValue.Substring(1, $rawValue.Length - 2)
        }

        return ($rawValue.Split('#')[0]).Trim()
    }

    return ""
}

function Resolve-AdminPassword {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RequestedPassword
    )

    if (-not [string]::IsNullOrWhiteSpace($env:CORE64_ADMIN_PASSWORD)) {
        return $env:CORE64_ADMIN_PASSWORD.Trim()
    }

    if (-not [string]::IsNullOrWhiteSpace($RequestedPassword) -and $RequestedPassword -ne "core64admin") {
        return $RequestedPassword
    }

    $backendAdminPassword = Get-BackendEnvValue -Key "ADMIN_PASSWORD" -EnvPath (Join-Path $repoRoot "backend/.env")
    if (-not [string]::IsNullOrWhiteSpace($backendAdminPassword)) {
        return $backendAdminPassword
    }

    if (-not [string]::IsNullOrWhiteSpace($RequestedPassword)) {
        return $RequestedPassword
    }

    return "core64admin"
}

function Invoke-SmokeCheck {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ApiBase,

        [Parameter(Mandatory = $true)]
        [string]$AdminPassword,

        [Parameter(Mandatory = $true)]
        [int]$SmokeTimeoutMs,

        [Parameter(Mandatory = $true)]
        [bool]$SmokeContact,

        [Parameter(Mandatory = $true)]
        [bool]$SmokeRateLimitCheck,

        [Parameter(Mandatory = $true)]
        [int]$SmokeRateLimitAttempts,

        [Parameter(Mandatory = $true)]
        [int]$SmokeRateLimitCollectionsAttempts
    )

    $env:CORE64_API_BASE = $ApiBase
    $env:CORE64_ADMIN_PASSWORD = $AdminPassword
    $env:CORE64_SMOKE_TIMEOUT_MS = [string]$SmokeTimeoutMs
    $env:CORE64_SMOKE_CONTACT = if ($SmokeContact) { "true" } else { "false" }
    $env:CORE64_SMOKE_RATE_LIMIT_CHECK = if ($SmokeRateLimitCheck) { "true" } else { "false" }
    if ($SmokeRateLimitCheck) {
        $env:CORE64_SMOKE_RATE_LIMIT_ATTEMPTS = [string]$SmokeRateLimitAttempts
        $env:CORE64_SMOKE_RATE_LIMIT_COLLECTIONS_ATTEMPTS = [string]$SmokeRateLimitCollectionsAttempts
    } else {
        Remove-Item Env:CORE64_SMOKE_RATE_LIMIT_ATTEMPTS -ErrorAction SilentlyContinue
        Remove-Item Env:CORE64_SMOKE_RATE_LIMIT_COLLECTIONS_ATTEMPTS -ErrorAction SilentlyContinue
    }

    $tempOutputPath = [System.IO.Path]::GetTempFileName()
    try {
        node scripts/smoke-check.mjs *> $tempOutputPath
        $exitCode = $LASTEXITCODE
        $output = Get-Content -LiteralPath $tempOutputPath -Raw
        if (-not [string]::IsNullOrWhiteSpace($output)) {
            Write-Host ($output.TrimEnd())
        }

        return @{
            ExitCode = $exitCode
            Output = $output
        }
    } finally {
        Remove-Item -LiteralPath $tempOutputPath -ErrorAction SilentlyContinue
    }
}

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

if ($Core64SmokeRateLimitAttempts -lt 2) {
    throw "Core64SmokeRateLimitAttempts must be >= 2."
}

if ($Core64SmokeRateLimitCollectionsAttempts -lt 2) {
    throw "Core64SmokeRateLimitCollectionsAttempts must be >= 2."
}

if ($MinimumApprovals -lt 1 -or $MinimumApprovals -gt 6) {
    throw "MinimumApprovals must be between 1 and 6."
}

$ExpectedCheckContexts = @($ExpectedCheckContexts | ForEach-Object { $_.Trim() } | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique)
if ($ExpectedCheckContexts.Count -eq 0) {
    throw "ExpectedCheckContexts cannot be empty."
}

$resolvedCore64AdminPassword = Resolve-AdminPassword -RequestedPassword $Core64AdminPassword
if ([string]::IsNullOrWhiteSpace($resolvedCore64AdminPassword)) {
    throw "Core64AdminPassword could not be resolved. Set CORE64_ADMIN_PASSWORD env var or backend/.env ADMIN_PASSWORD."
}

Write-Host "[1/10] Running DB snapshot helper self-test..."
node scripts/test-print-db-target-snapshot.mjs
if ($LASTEXITCODE -ne 0) {
    throw "DB snapshot helper self-test failed."
}

Write-Host "[2/10] Running DATABASE_URL policy helper self-test..."
node scripts/test-check-database-url-policy.mjs
if ($LASTEXITCODE -ne 0) {
    throw "DATABASE_URL policy helper self-test failed."
}

Write-Host "[3/10] Running DATABASE_URL pooler sslmode helper self-test..."
node scripts/test-set-database-url-pooler-sslmode.mjs
if ($LASTEXITCODE -ne 0) {
    throw "DATABASE_URL pooler sslmode helper self-test failed."
}

Write-Host "[4/10] Running Cloud Run network hint helper self-test..."
node scripts/test-print-cloud-run-network-hint.mjs
if ($LASTEXITCODE -ne 0) {
    throw "Cloud Run network hint helper self-test failed."
}

Write-Host "[5/10] Running Cloud Run DB route verdict helper self-test..."
node scripts/test-print-cloud-run-db-route-verdict.mjs
if ($LASTEXITCODE -ne 0) {
    throw "Cloud Run DB route verdict helper self-test failed."
}

Write-Host "[6/10] Running DB runtime TLS hint helper self-test..."
node scripts/test-print-db-runtime-tls-hint.mjs
if ($LASTEXITCODE -ne 0) {
    throw "DB runtime TLS hint helper self-test failed."
}

Write-Host "[7/10] Running smoke check..."
$smokeResult = Invoke-SmokeCheck `
    -ApiBase $Core64ApiBase `
    -AdminPassword $resolvedCore64AdminPassword `
    -SmokeTimeoutMs $Core64SmokeTimeoutMs `
    -SmokeContact $Core64SmokeContact `
    -SmokeRateLimitCheck $false `
    -SmokeRateLimitAttempts $Core64SmokeRateLimitAttempts `
    -SmokeRateLimitCollectionsAttempts $Core64SmokeRateLimitCollectionsAttempts
if ($smokeResult.ExitCode -ne 0) {
    $isFetchFailed = $smokeResult.Output -match 'Smoke check failed:\s*fetch failed'
    if ($isFetchFailed -and ($Core64ApiBase -match '^https?://localhost(:\d+)?(/.*)?$')) {
        $fallbackApiBase = $Core64ApiBase -replace '://localhost', '://127.0.0.1'
        Write-Host "Smoke check failed using localhost fetch path. Retrying with $fallbackApiBase ..."
        $smokeResult = Invoke-SmokeCheck `
            -ApiBase $fallbackApiBase `
            -AdminPassword $resolvedCore64AdminPassword `
            -SmokeTimeoutMs $Core64SmokeTimeoutMs `
            -SmokeContact $Core64SmokeContact `
            -SmokeRateLimitCheck $false `
            -SmokeRateLimitAttempts $Core64SmokeRateLimitAttempts `
            -SmokeRateLimitCollectionsAttempts $Core64SmokeRateLimitCollectionsAttempts
    }
}

if ($smokeResult.ExitCode -ne 0) {
    throw "Smoke check failed."
}

Write-Host "[8/10] Running settings/public contract check..."
node scripts/settings-public-contract-check.mjs
if ($LASTEXITCODE -ne 0) {
    throw "Settings/public contract check failed."
}

Write-Host "[9/10] Running settings i18n consistency check..."
node scripts/check-settings-i18n-consistency.mjs
if ($LASTEXITCODE -ne 0) {
    throw "Settings i18n consistency check failed."
}

Write-Host "[10/10] Running branch protection policy verification..."
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

if ($Core64SmokeRateLimitCheck) {
    Write-Host "[Rate-limit] Running 429 smoke check..."
    $rateLimitResult = Invoke-SmokeCheck `
        -ApiBase $Core64ApiBase `
        -AdminPassword $resolvedCore64AdminPassword `
        -SmokeTimeoutMs $Core64SmokeTimeoutMs `
        -SmokeContact $false `
        -SmokeRateLimitCheck $true `
        -SmokeRateLimitAttempts $Core64SmokeRateLimitAttempts `
        -SmokeRateLimitCollectionsAttempts $Core64SmokeRateLimitCollectionsAttempts

    if ($rateLimitResult.ExitCode -ne 0) {
        $isFetchFailed = $rateLimitResult.Output -match 'Smoke check failed:\s*fetch failed'
        if ($isFetchFailed -and ($Core64ApiBase -match '^https?://localhost(:\d+)?(/.*)?$')) {
            $fallbackApiBase = $Core64ApiBase -replace '://localhost', '://127.0.0.1'
            Write-Host "Rate-limit smoke failed using localhost fetch path. Retrying with $fallbackApiBase ..."
            $rateLimitResult = Invoke-SmokeCheck `
                -ApiBase $fallbackApiBase `
                -AdminPassword $resolvedCore64AdminPassword `
                -SmokeTimeoutMs $Core64SmokeTimeoutMs `
                -SmokeContact $false `
                -SmokeRateLimitCheck $true `
                -SmokeRateLimitAttempts $Core64SmokeRateLimitAttempts `
                -SmokeRateLimitCollectionsAttempts $Core64SmokeRateLimitCollectionsAttempts
        }
    }

    if ($rateLimitResult.ExitCode -ne 0) {
        throw "Rate-limit smoke check failed."
    }
}

Write-Host "Pre-release local gate PASSED."
