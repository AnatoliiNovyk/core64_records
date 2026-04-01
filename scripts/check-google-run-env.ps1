param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

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
    $value = [string](Get-Item -Path "Env:$varName" -ErrorAction SilentlyContinue).Value
    if ([string]::IsNullOrWhiteSpace($value)) {
        $errors.Add("Missing required environment variable: $varName")
    }
}

foreach ($varName in $requiredSecrets) {
    $value = [string](Get-Item -Path "Env:$varName" -ErrorAction SilentlyContinue).Value
    if ([string]::IsNullOrWhiteSpace($value)) {
        $errors.Add("Missing required secret value in environment: $varName")
    }
}

$captchaProvider = [string](Get-Item -Path "Env:CONTACT_CAPTCHA_PROVIDER" -ErrorAction SilentlyContinue).Value
$captchaProvider = $captchaProvider.Trim().ToLowerInvariant()

if ($captchaProvider -and @("none", "hcaptcha", "recaptcha_v2") -notcontains $captchaProvider) {
    $errors.Add("CONTACT_CAPTCHA_PROVIDER must be one of: none, hcaptcha, recaptcha_v2")
}

if (@("hcaptcha", "recaptcha_v2") -contains $captchaProvider) {
    $captchaSecret = [string](Get-Item -Path "Env:CONTACT_CAPTCHA_SECRET" -ErrorAction SilentlyContinue).Value
    if ([string]::IsNullOrWhiteSpace($captchaSecret)) {
        $errors.Add("CONTACT_CAPTCHA_SECRET is required when CONTACT_CAPTCHA_PROVIDER is $captchaProvider")
    }
}

$jwtSecret = [string](Get-Item -Path "Env:JWT_SECRET" -ErrorAction SilentlyContinue).Value
if (-not [string]::IsNullOrWhiteSpace($jwtSecret) -and $jwtSecret.Trim().Length -lt 24) {
    $errors.Add("JWT_SECRET must be at least 24 characters")
}

$adminPassword = [string](Get-Item -Path "Env:ADMIN_PASSWORD" -ErrorAction SilentlyContinue).Value
if (-not [string]::IsNullOrWhiteSpace($adminPassword) -and $adminPassword.Trim().Length -lt 12) {
    $errors.Add("ADMIN_PASSWORD must be at least 12 characters")
}

$corsOrigin = [string](Get-Item -Path "Env:CORS_ORIGIN" -ErrorAction SilentlyContinue).Value
if (-not [string]::IsNullOrWhiteSpace($corsOrigin) -and $corsOrigin.Contains("*")) {
    $errors.Add("CORS_ORIGIN must not include wildcard '*' for production")
}

if ($errors.Count -gt 0) {
    Write-Host "Google Run deployment env check FAILED:" -ForegroundColor Red
    foreach ($entry in $errors) {
        Write-Host "- $entry" -ForegroundColor Red
    }
    exit 1
}

Write-Host "Google Run deployment env check PASSED." -ForegroundColor Green
