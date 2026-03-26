param(
    [Parameter(Mandatory = $false)]
    [string]$Owner = "AnatoliiNovyk",

    [Parameter(Mandatory = $false)]
    [string]$Repo = "core64_records",

    [Parameter(Mandatory = $false)]
    [string]$Branch = "main",

    [Parameter(Mandatory = $false)]
    [switch]$DryRun,

    [Parameter(Mandatory = $false)]
    [string]$Token
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($Token)) {
    $Token = $env:GITHUB_TOKEN
}

if ([string]::IsNullOrWhiteSpace($Token)) {
    throw "GitHub token is missing. Set GITHUB_TOKEN env var or pass -Token."
}

$baseUri = "https://api.github.com/repos/$Owner/$Repo/branches/$Branch/protection"

$headers = @{
    Authorization = "Bearer $Token"
    Accept = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
}

$operations = @(
    @{ Name = "required status checks"; Uri = "$baseUri/required_status_checks" },
    @{ Name = "required pull request reviews"; Uri = "$baseUri/required_pull_request_reviews" },
    @{ Name = "admin enforcement"; Uri = "$baseUri/enforce_admins" }
)

if ($DryRun.IsPresent) {
    Write-Host "Dry run mode enabled. No changes were sent to GitHub."
    $operations | ForEach-Object {
        Write-Host "Would disable $($_.Name) via DELETE $($_.Uri)"
    }
    return
}

foreach ($op in $operations) {
    try {
        Invoke-RestMethod -Method Delete -Uri $op.Uri -Headers $headers | Out-Null
        Write-Host "Disabled $($op.Name)."
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 404) {
            Write-Host "Skipped $($op.Name): not configured."
        }
        else {
            throw
        }
    }
}

Write-Host "Branch protection has been relaxed for $Owner/$Repo on '$Branch'."
Write-Host "Reapply defaults with scripts/set-branch-protection.ps1 after hotfix merge."
