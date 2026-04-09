param(
    [Parameter(Mandatory = $false)]
    [string]$OwnersFilePath = (Join-Path $PSScriptRoot "..\RELEASE_OWNERS_AND_ESCALATION.md"),

    [Parameter(Mandatory = $false)]
    [int]$MinimumUniqueOwners = 3,

    [Parameter(Mandatory = $false)]
    [bool]$OverrideRoleDiversity = $false
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ($MinimumUniqueOwners -lt 1) {
    throw "MinimumUniqueOwners must be >= 1."
}

if (-not (Test-Path -LiteralPath $OwnersFilePath)) {
    throw "Owners file not found: $OwnersFilePath"
}

$rawContent = Get-Content -LiteralPath $OwnersFilePath
$requiredRoles = @(
    "Release Commander",
    "Deployer",
    "Verifier",
    "Database Owner",
    "Communications Owner"
)

function Normalize-OwnerName {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Value
    )

    $normalized = [string]$Value
    $normalized = $normalized.Trim()

    if ($normalized.Length -ge 2) {
        $firstChar = [int][char]$normalized[0]
        $lastChar = [int][char]$normalized[$normalized.Length - 1]
        if ($firstChar -eq $lastChar -and ($firstChar -in @(34, 39, 96))) {
            $normalized = $normalized.Substring(1, $normalized.Length - 2).Trim()
        }
    }

    $normalized = ($normalized -replace "\s+", " ").Trim()

    $blockedValues = @(
        "",
        "tbd",
        "n/a",
        "na",
        "none",
        "unassigned",
        "fill before release",
        "<name>",
        "<owner>",
        "<assignee>"
    )

    if ($blockedValues -contains $normalized.ToLowerInvariant()) {
        return ""
    }

    return $normalized
}

$assignments = [ordered]@{}
foreach ($role in $requiredRoles) {
    $assignments[$role] = ""
}

$assignmentRegex = '^\s*-\s*(Release Commander|Deployer|Verifier|Database Owner|Communications Owner)\s*:\s*(.+?)\s*$'
foreach ($line in $rawContent) {
    $match = [regex]::Match($line, $assignmentRegex)
    if (-not $match.Success) {
        continue
    }

    $role = $match.Groups[1].Value.Trim()
    $value = Normalize-OwnerName -Value $match.Groups[2].Value
    $assignments[$role] = $value
}

$missingRoles = @(
    $requiredRoles | Where-Object { [string]::IsNullOrWhiteSpace($assignments[$_]) }
)

$assignedOwners = @(
    $requiredRoles |
        ForEach-Object { $assignments[$_] } |
        Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
)

$uniqueOwnerKeys = @(
    $assignedOwners |
        ForEach-Object { $_.Trim().ToLowerInvariant() } |
        Sort-Object -Unique
)
$uniqueOwnerCount = $uniqueOwnerKeys.Count

$roleMapByOwner = [ordered]@{}
foreach ($role in $requiredRoles) {
    $owner = $assignments[$role]
    if ([string]::IsNullOrWhiteSpace($owner)) {
        continue
    }

    if (-not $roleMapByOwner.Contains($owner)) {
        $roleMapByOwner[$owner] = @()
    }

    $roleMapByOwner[$owner] += $role
}

$isDiverse = $missingRoles.Count -eq 0 -and $uniqueOwnerCount -ge $MinimumUniqueOwners
$status = if ($isDiverse) { "pass" } elseif ($OverrideRoleDiversity) { "override" } else { "fail" }

$result = [ordered]@{
    filePath = $OwnersFilePath
    minimumUniqueOwners = $MinimumUniqueOwners
    requiredRoleCount = $requiredRoles.Count
    assignedRoleCount = $assignedOwners.Count
    uniqueOwnerCount = $uniqueOwnerCount
    missingRoles = $missingRoles
    assignments = $assignments
    ownerRoles = $roleMapByOwner
    isDiverse = $isDiverse
    overrideRoleDiversity = $OverrideRoleDiversity
    status = $status
}

Write-Host (ConvertTo-Json $result -Depth 6)

if ($status -eq "fail") {
    exit 1
}

if ($status -eq "override") {
    Write-Warning "Release owner diversity check bypassed by override."
}

exit 0
