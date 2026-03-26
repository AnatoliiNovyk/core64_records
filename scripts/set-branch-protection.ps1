param(
    [Parameter(Mandatory = $false)]
    [string]$Owner = "AnatoliiNovyk",

    [Parameter(Mandatory = $false)]
    [string]$Repo = "core64_records",

    [Parameter(Mandatory = $false)]
    [string]$Branch = "main",

    [Parameter(Mandatory = $false)]
    [string]$CheckContext = "smoke",

    [Parameter(Mandatory = $false)]
    [int]$RequiredApprovals = 1,

    [Parameter(Mandatory = $false)]
    [switch]$RequireConversationResolution,

    [Parameter(Mandatory = $false)]
    [switch]$DoNotEnforceAdmins,

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

if ($RequiredApprovals -lt 1 -or $RequiredApprovals -gt 6) {
    throw "RequiredApprovals must be between 1 and 6."
}

$uri = "https://api.github.com/repos/$Owner/$Repo/branches/$Branch/protection"

$body = @{
    required_status_checks = @{
        strict   = $true
        contexts = @($CheckContext)
    }
    enforce_admins = (-not $DoNotEnforceAdmins.IsPresent)
    required_pull_request_reviews = @{
        dismiss_stale_reviews           = $true
        require_code_owner_reviews      = $false
        required_approving_review_count = $RequiredApprovals
    }
    restrictions = $null
    required_linear_history = $false
    allow_force_pushes = $false
    allow_deletions = $false
    block_creations = $false
    required_conversation_resolution = $RequireConversationResolution.IsPresent
    lock_branch = $false
    allow_fork_syncing = $true
}

$headers = @{
    Authorization = "Bearer $Token"
    Accept = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
}

Write-Host "Applying branch protection for $Owner/$Repo on '$Branch' with check '$CheckContext'..."

$response = Invoke-RestMethod -Method Put -Uri $uri -Headers $headers -Body ($body | ConvertTo-Json -Depth 10) -ContentType "application/json"

Write-Host "Branch protection applied successfully."
Write-Host "Required checks:" ($response.required_status_checks.contexts -join ", ")
Write-Host "Required approvals:" $response.required_pull_request_reviews.required_approving_review_count
