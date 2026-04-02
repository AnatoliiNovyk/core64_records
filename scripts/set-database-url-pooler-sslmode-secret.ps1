param(
    [Parameter(Mandatory = $false)]
    [string]$ProjectId = "core64records",

    [Parameter(Mandatory = $false)]
    [string]$SecretName = "DATABASE_URL",

    [Parameter(Mandatory = $false)]
    [ValidateSet("require", "verify-ca", "verify-full")]
    [string]$DesiredSslMode = "require"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Ensure-Tool {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name
    )

    $tool = Get-Command -Name $Name -ErrorAction SilentlyContinue
    if ($null -eq $tool) {
        throw "Required tool '$Name' is not available in PATH."
    }
}

Ensure-Tool -Name "gcloud"
Ensure-Tool -Name "node"

function Invoke-GcloudText {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Args,

        [Parameter(Mandatory = $true)]
        [string]$FailureMessage
    )

    $result = & gcloud @Args
    if ($LASTEXITCODE -ne 0) {
        throw "$FailureMessage (exit code $LASTEXITCODE)."
    }

    return ($result -join "`n")
}

function Invoke-GcloudNoOutput {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Args,

        [Parameter(Mandatory = $true)]
        [string]$FailureMessage
    )

    & gcloud @Args | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "$FailureMessage (exit code $LASTEXITCODE)."
    }
}

function Invoke-NodeText {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Args,

        [Parameter(Mandatory = $true)]
        [string]$FailureMessage
    )

    $result = & node @Args
    if ($LASTEXITCODE -ne 0) {
        throw "$FailureMessage (exit code $LASTEXITCODE)."
    }

    return ($result -join "`n")
}

$currentUrl = (Invoke-GcloudText -Args @("secrets", "versions", "access", "latest", "--project", $ProjectId, "--secret", $SecretName) -FailureMessage "Failed to read latest secret version for '$SecretName' in project '$ProjectId'").Trim()
if ([string]::IsNullOrWhiteSpace($currentUrl)) {
    throw "Secret '$SecretName' in project '$ProjectId' is empty."
}

$previousDatabaseUrlValue = $env:DATABASE_URL_VALUE
$previousDbPoolerSslMode = $env:DB_POOLER_SSLMODE

try {
    $env:DATABASE_URL_VALUE = $currentUrl
    $env:DB_POOLER_SSLMODE = $DesiredSslMode

    $updatedUrl = (Invoke-NodeText -Args @("scripts/set-database-url-pooler-sslmode.mjs", "--raw-url", "--strict") -FailureMessage "Failed to apply pooler sslmode remediation for DATABASE_URL").Trim()
}
finally {
    if ($null -eq $previousDatabaseUrlValue) {
        Remove-Item Env:DATABASE_URL_VALUE -ErrorAction SilentlyContinue
    }
    else {
        $env:DATABASE_URL_VALUE = $previousDatabaseUrlValue
    }

    if ($null -eq $previousDbPoolerSslMode) {
        Remove-Item Env:DB_POOLER_SSLMODE -ErrorAction SilentlyContinue
    }
    else {
        $env:DB_POOLER_SSLMODE = $previousDbPoolerSslMode
    }
}

if ([string]::IsNullOrWhiteSpace($updatedUrl)) {
    throw "Pooler sslmode remediation returned an empty DATABASE_URL."
}

if ($updatedUrl -eq $currentUrl) {
    Write-Host "No change needed: latest secret already has allowed pooler sslmode ($DesiredSslMode or equivalent)." -ForegroundColor Yellow
}
else {
    $tmpFile = [System.IO.Path]::GetTempFileName()
    try {
        [System.IO.File]::WriteAllText($tmpFile, $updatedUrl, [System.Text.UTF8Encoding]::new($false))
        Invoke-GcloudNoOutput -Args @("secrets", "versions", "add", $SecretName, "--project", $ProjectId, "--data-file", $tmpFile) -FailureMessage "Failed to add a new secret version for '$SecretName'"
    }
    finally {
        Remove-Item -Path $tmpFile -ErrorAction SilentlyContinue
    }

    Write-Host "Updated secret '$SecretName' in project '$ProjectId' with pooler sslmode '$DesiredSslMode'." -ForegroundColor Green
}

$latestUrl = (Invoke-GcloudText -Args @("secrets", "versions", "access", "latest", "--project", $ProjectId, "--secret", $SecretName) -FailureMessage "Failed to re-read latest secret version for '$SecretName' in project '$ProjectId'").Trim()
$previousDatabaseUrlValue = $env:DATABASE_URL_VALUE

try {
    $env:DATABASE_URL_VALUE = $latestUrl
    Invoke-NodeText -Args @("scripts/check-database-url-policy.mjs", "--strict") -FailureMessage "Strict DATABASE_URL policy verification failed after update" | Out-Null
}
finally {
    if ($null -eq $previousDatabaseUrlValue) {
        Remove-Item Env:DATABASE_URL_VALUE -ErrorAction SilentlyContinue
    }
    else {
        $env:DATABASE_URL_VALUE = $previousDatabaseUrlValue
    }
}

Write-Host "Strict DATABASE_URL verification passed on latest secret." -ForegroundColor Green
