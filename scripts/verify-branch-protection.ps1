param(
    [Parameter(Mandatory = $false)]
    [string]$Owner = "AnatoliiNovyk",

    [Parameter(Mandatory = $false)]
    [string]$Repo = "core64_records",

    [Parameter(Mandatory = $false)]
    [string]$Branch = "main",

    [Parameter(Mandatory = $false)]
    [string[]]$ExpectedCheckContexts = @("smoke", "Smoke Check / smoke"),

    [Parameter(Mandatory = $false)]
    [string]$ExpectedCheckContext,

    [Parameter(Mandatory = $false)]
    [int]$MinimumApprovals = 1,

    [Parameter(Mandatory = $false)]
    [ValidateSet("any", "true", "false")]
    [string]$ExpectedConversationResolution = "any",

    [Parameter(Mandatory = $false)]
    [string]$Token,

    [Parameter(Mandatory = $false)]
    [switch]$AsJson
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ($MinimumApprovals -lt 1 -or $MinimumApprovals -gt 6) {
    throw "MinimumApprovals must be between 1 and 6."
}

if ($PSBoundParameters.ContainsKey("ExpectedCheckContext")) {
    $ExpectedCheckContexts = @($ExpectedCheckContext)
}

$ExpectedCheckContexts = @($ExpectedCheckContexts | ForEach-Object { $_.Trim() } | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique)

if ($ExpectedCheckContexts.Count -eq 0) {
    throw "ExpectedCheckContexts cannot be empty."
}

if ([string]::IsNullOrWhiteSpace($Token)) {
    $Token = $env:GITHUB_TOKEN
}

if ([string]::IsNullOrWhiteSpace($Token)) {
    throw "GitHub token is missing. Set GITHUB_TOKEN env var or pass -Token."
}

$uri = "https://api.github.com/repos/$Owner/$Repo/branches/$Branch/protection"

$headers = @{
    Authorization = "Bearer $Token"
    Accept = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
}

try {
    $response = Invoke-RestMethod -Method Get -Uri $uri -Headers $headers
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401 -or $statusCode -eq 403 -or $statusCode -eq 404) {
        throw "Unable to read branch protection (HTTP $statusCode). Verify token permissions and repository/branch names."
    }
    throw
}

$contexts = @()
if ($null -ne $response.required_status_checks -and $null -ne $response.required_status_checks.contexts) {
    $contexts = @($response.required_status_checks.contexts)
}

$requiredApprovals = 0
$dismissStaleReviews = $false
if ($null -ne $response.required_pull_request_reviews) {
    $requiredApprovals = $response.required_pull_request_reviews.required_approving_review_count
    $dismissStaleReviews = $response.required_pull_request_reviews.dismiss_stale_reviews
}

$actualConversationResolution = $false
if ($null -ne $response.required_conversation_resolution) {
    $actualConversationResolution = [bool]$response.required_conversation_resolution.enabled
}

$checks = @()

function Add-Check {
    param(
        [string]$Name,
        [string]$Expected,
        [string]$Actual,
        [bool]$Passed
    )

    $script:checks += [pscustomobject]@{
        name = $Name
        expected = $Expected
        actual = $Actual
        passed = $Passed
    }
}

Add-Check -Name "enforce_admins" -Expected "true" -Actual ([string][bool]$response.enforce_admins.enabled).ToLowerInvariant() -Passed ([bool]$response.enforce_admins.enabled)
Add-Check -Name "required_status_checks.strict" -Expected "true" -Actual ([string][bool]$response.required_status_checks.strict).ToLowerInvariant() -Passed ([bool]$response.required_status_checks.strict)
$matchingContexts = @($ExpectedCheckContexts | Where-Object { $contexts -contains $_ })
Add-Check -Name "required_status_check_context_any" -Expected ($ExpectedCheckContexts -join " | ") -Actual ($(if ($contexts.Count -gt 0) { $contexts -join "," } else { "none" })) -Passed ($matchingContexts.Count -gt 0)
Add-Check -Name "required_approvals_minimum" -Expected (">= $MinimumApprovals") -Actual ([string]$requiredApprovals) -Passed ($requiredApprovals -ge $MinimumApprovals)
Add-Check -Name "dismiss_stale_reviews" -Expected "true" -Actual ([string]$dismissStaleReviews).ToLowerInvariant() -Passed ($dismissStaleReviews)

if ($ExpectedConversationResolution -ne "any") {
    $expectedBool = $ExpectedConversationResolution -eq "true"
    Add-Check -Name "required_conversation_resolution" -Expected ([string]$expectedBool).ToLowerInvariant() -Actual ([string]$actualConversationResolution).ToLowerInvariant() -Passed ($actualConversationResolution -eq $expectedBool)
}

$failedChecks = @($checks | Where-Object { -not $_.passed })
$passed = $failedChecks.Count -eq 0

$result = [pscustomobject]@{
    owner = $Owner
    repo = $Repo
    branch = $Branch
    expectedCheckContexts = $ExpectedCheckContexts
    passed = $passed
    checks = $checks
}

if ($AsJson.IsPresent) {
    $result | ConvertTo-Json -Depth 10
}
else {
    Write-Host "Branch protection policy verification for $Owner/$Repo on '$Branch':"
    foreach ($check in $checks) {
        $status = if ($check.passed) { "PASS" } else { "FAIL" }
        Write-Host "- [$status] $($check.name): expected=$($check.expected), actual=$($check.actual)"
    }

    if ($passed) {
        Write-Host "Policy verification PASSED."
    }
    else {
        Write-Host "Policy verification FAILED."
    }
}

if (-not $passed) {
    exit 1
}
