param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-EnvValue {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name
    )

    $item = Get-Item -Path "Env:$Name" -ErrorAction SilentlyContinue
    if ($null -eq $item) {
        return ""
    }

    return [string]$item.Value
}

$requiredVars = @(
    "GCP_PROJECT_ID",
    "GCP_REGION",
    "GCP_SERVICE_NAME",
    "IMAGE_URI",
    "CORS_ORIGIN",
    "CONTACT_CAPTCHA_PROVIDER"
)

$requiredSecrets = @(
    "DATABASE_URL",
    "JWT_SECRET",
    "ADMIN_PASSWORD"
)

$errors = New-Object System.Collections.Generic.List[string]

foreach ($varName in $requiredVars) {
    $value = Get-EnvValue -Name $varName
    if ([string]::IsNullOrWhiteSpace($value)) {
        $errors.Add("Missing required environment variable: $varName")
    }
}

foreach ($varName in $requiredSecrets) {
    $value = Get-EnvValue -Name $varName
    if ([string]::IsNullOrWhiteSpace($value)) {
        $errors.Add("Missing required secret value in environment: $varName")
    }
}

$captchaProvider = Get-EnvValue -Name "CONTACT_CAPTCHA_PROVIDER"
$captchaProvider = $captchaProvider.Trim().ToLowerInvariant()

if ($captchaProvider -and @("none", "hcaptcha", "recaptcha_v2") -notcontains $captchaProvider) {
    $errors.Add("CONTACT_CAPTCHA_PROVIDER must be one of: none, hcaptcha, recaptcha_v2")
}

if (@("hcaptcha", "recaptcha_v2") -contains $captchaProvider) {
    $captchaSecret = Get-EnvValue -Name "CONTACT_CAPTCHA_SECRET"
    if ([string]::IsNullOrWhiteSpace($captchaSecret)) {
        $errors.Add("CONTACT_CAPTCHA_SECRET is required when CONTACT_CAPTCHA_PROVIDER is $captchaProvider")
    }
}

$jwtSecret = Get-EnvValue -Name "JWT_SECRET"
if (-not [string]::IsNullOrWhiteSpace($jwtSecret) -and $jwtSecret.Trim().Length -lt 24) {
    $errors.Add("JWT_SECRET must be at least 24 characters")
}

$adminPassword = Get-EnvValue -Name "ADMIN_PASSWORD"
if (-not [string]::IsNullOrWhiteSpace($adminPassword) -and $adminPassword.Trim().Length -lt 12) {
    $errors.Add("ADMIN_PASSWORD must be at least 12 characters")
}

$corsOrigin = Get-EnvValue -Name "CORS_ORIGIN"
if (-not [string]::IsNullOrWhiteSpace($corsOrigin) -and $corsOrigin.Contains("*")) {
    $errors.Add("CORS_ORIGIN must not include wildcard '*' for production")
}

$databaseUrl = Get-EnvValue -Name "DATABASE_URL"
if (-not [string]::IsNullOrWhiteSpace($databaseUrl)) {
    try {
        $previousDatabaseUrlValue = $env:DATABASE_URL_VALUE
        $env:DATABASE_URL_VALUE = $databaseUrl
        $policyJson = & node scripts/check-database-url-policy.mjs
        if ($null -eq $previousDatabaseUrlValue) {
            Remove-Item Env:DATABASE_URL_VALUE -ErrorAction SilentlyContinue
        }
        else {
            $env:DATABASE_URL_VALUE = $previousDatabaseUrlValue
        }

        $policy = $policyJson | ConvertFrom-Json
        if (-not $policy.valid) {
            $errors.Add("DATABASE_URL policy: $($policy.reason) - $($policy.hint)")
        }
    }
    catch {
        $errors.Add("DATABASE_URL policy check failed: $($_.Exception.Message)")
    }
}

$dbTimeoutVars = @(
    "DB_CONNECTION_TIMEOUT_MS",
    "DB_QUERY_TIMEOUT_MS",
    "DB_STATEMENT_TIMEOUT_MS"
)

foreach ($varName in $dbTimeoutVars) {
    $rawValue = Get-EnvValue -Name $varName
    if ([string]::IsNullOrWhiteSpace($rawValue)) {
        continue
    }

    $parsedValue = 0
    if (-not [int]::TryParse($rawValue.Trim(), [ref]$parsedValue) -or $parsedValue -lt 1000) {
        $errors.Add("$varName must be an integer >= 1000 when provided")
    }
}

if ($errors.Count -gt 0) {
    Write-Host "Google Run deployment env check FAILED:" -ForegroundColor Red
    foreach ($entry in $errors) {
        Write-Host "- $entry" -ForegroundColor Red
    }
    exit 1
}

Write-Host "Google Run deployment env check PASSED." -ForegroundColor Green
