param(
    [Parameter(Mandatory = $false)]
    [string]$Owner = "AnatoliiNovyk",

    [Parameter(Mandatory = $false)]
    [string]$Repo = "core64_records",

    [Parameter(Mandatory = $false)]
    [string]$Branch = "main",

    [Parameter(Mandatory = $false)]
    [string]$Token,

    [Parameter(Mandatory = $false)]
    [switch]$AsJson
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($Token)) {
    $Token = $env:GITHUB_TOKEN
}

$uri = "https://api.github.com/repos/$Owner/$Repo/branches/$Branch/protection"

$headers = @{
    Accept = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
}

if (-not [string]::IsNullOrWhiteSpace($Token)) {
    $headers.Authorization = "Bearer $Token"
}

try {
    $response = Invoke-RestMethod -Method Get -Uri $uri -Headers $headers
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401 -or $statusCode -eq 403 -or $statusCode -eq 404) {
        throw "Unable to read branch protection (HTTP $statusCode). Provide GITHUB_TOKEN with repo admin access or verify repository/branch names."
    }
    throw
}

if ($AsJson.IsPresent) {
    $response | ConvertTo-Json -Depth 20
    return
}

$contexts = @()
if ($null -ne $response.required_status_checks -and $null -ne $response.required_status_checks.contexts) {
    $contexts = @($response.required_status_checks.contexts)
}

$requiredApprovals = 0
if ($null -ne $response.required_pull_request_reviews) {
    $requiredApprovals = $response.required_pull_request_reviews.required_approving_review_count
}

Write-Host "Branch protection for $Owner/$Repo on '$Branch':"
Write-Host "- Enforce admins:" $response.enforce_admins.enabled
Write-Host "- Require up to date branch:" $response.required_status_checks.strict
Write-Host "- Required checks:" ($(if ($contexts.Count -gt 0) { $contexts -join ", " } else { "none" }))
Write-Host "- Required approvals:" $requiredApprovals
Write-Host "- Dismiss stale reviews:" ($(if ($null -ne $response.required_pull_request_reviews) { $response.required_pull_request_reviews.dismiss_stale_reviews } else { $false }))
Write-Host "- Require conversation resolution:" $response.required_conversation_resolution.enabled
