#Requires -Version 7.0
<#
.SYNOPSIS
    Updates the changelog with the latest changes.
.DESCRIPTION
    - Verifies you are on the main branch and in sync with origin/main
    - Detects the latest semver tag (vX.Y.Z)
    - Classifies commits since the last tag into Keep a Changelog categories
      (Added, Changed, Deprecated, Removed, Fixed, Security)
    - Replaces the [Unreleased] section in CHANGELOG.md with categorized entries
    - Marks breaking changes with **BREAKING** prefix
    - Suggests the next version: major (breaking), minor (features), or patch
    - Idempotent — safe to run multiple times
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# --- set cwd to the script folder (repo root) ---
$ScriptDir = $PSScriptRoot
Push-Location $ScriptDir

# --- Ensure we're in a git repo ---
if (-not (Test-Path .git)) {
    Write-Host "Error: Not in the root of a git repository." -ForegroundColor Red
    exit 1
}

# --- Ensure we're on main ---
$currentBranch = git rev-parse --abbrev-ref HEAD
if ($currentBranch -ne 'main') {
    Write-Host "Error: You are on branch '$currentBranch'. Switch to 'main' first." -ForegroundColor Red
    exit 1
}

# --- Fetch latest from origin ---
Write-Host "Fetching latest from origin..." -ForegroundColor Cyan
git fetch origin --tags

# --- Check local is not behind origin/main ---
$behind = git rev-list --count "HEAD..origin/main"

if ([int]$behind -gt 0) {
    Write-Host "Error: Local main is $behind commit(s) behind origin/main. Pull first, then try again." -ForegroundColor Red
    exit 1
}

$ahead = git rev-list --count "origin/main..HEAD"
if ([int]$ahead -gt 0) {
    Write-Host "Local main is $ahead commit(s) ahead of origin/main." -ForegroundColor Yellow
}

# --- Check working tree is clean ---
$status = git status --porcelain
if ($status) {
    Write-Host "Warning: Working tree is not clean." -ForegroundColor Yellow
}

Write-Host "On main, in sync with origin." -ForegroundColor Green
Write-Host ""

# --- Find latest semver tag ---
$allTags = git tag --sort=-v:refname | Where-Object { $_ -match '^v\d+\.\d+\.\d+$' }
$latestTag = $null

if ($allTags -and $allTags.Count -gt 0) {
    $latestTag = $allTags[0]
    Write-Host "Latest tag: $latestTag" -ForegroundColor Cyan

    # Parse version components
    $version = $latestTag -replace '^v', ''
    $parts = $version.Split('.')
    $major = [int]$parts[0]
    $minor = [int]$parts[1]
    $patch = [int]$parts[2]

} else {
    Write-Host "No existing semver tags found." -ForegroundColor Yellow
    $major = 1; $minor = 0; $patch = 0
}

# --- Fetch commits since last tag ---
$commitRange = if ($latestTag) { "$latestTag..HEAD" } else { "HEAD" }
$rawCommits = git log $commitRange --pretty=format:"%s" --no-merges

if (-not $rawCommits) {
    Write-Host "No new commits since $latestTag. Nothing to do." -ForegroundColor Yellow
    Pop-Location
    exit 0
}

# Filter out dependency updates, chore/docs commits, and stray merge commits
$commits = @($rawCommits | Where-Object {
    $_ -notmatch '^(chore|fix)\(deps\)' -and
    $_ -notmatch '^Merge pull request' -and
    $_ -notmatch '(?i)^chore(\(.+\))?:' -and
    $_ -notmatch '(?i)^docs(\(.+\))?:'
})

if ($commits.Count -eq 0) {
    Write-Host "All commits since $latestTag are dependency updates or merges. Nothing to add." -ForegroundColor Yellow
    Pop-Location
    exit 0
}

Write-Host "Found $($commits.Count) commit(s) to process." -ForegroundColor Cyan

# --- Classification rules (first match wins) ---
# Primary: conventional commit prefixes (1:1 with changelog headings)
# Fallback: verb-based heuristics for non-conventional messages
$classificationRules = @(
    # Conventional commit prefixes → changelog headings
    @{ Pattern = '(?i)^feat(\(.+\))?:\s*';        Category = 'Added' }
    @{ Pattern = '(?i)^fix(\(.+\))?:\s*';         Category = 'Fixed' }
    @{ Pattern = '(?i)^refactor(\(.+\))?:\s*';    Category = 'Changed' }
    @{ Pattern = '(?i)^deprecated(\(.+\))?:\s*';  Category = 'Deprecated' }
    @{ Pattern = '(?i)^removed(\(.+\))?:\s*';     Category = 'Removed' }
    @{ Pattern = '(?i)^security(\(.+\))?:\s*';    Category = 'Security' }
    # Verb fallbacks for non-conventional messages
    @{ Pattern = '(?i)^Add\s';                     Category = 'Added' }
    @{ Pattern = '(?i)^Implement\s';               Category = 'Added' }
    @{ Pattern = '(?i)^Refactor\s';               Category = 'Changed' }
    @{ Pattern = '(?i)^Update\s';                 Category = 'Changed' }
    @{ Pattern = '(?i)^Enhance\s';                Category = 'Changed' }
    @{ Pattern = '(?i)^Improve\s';                Category = 'Changed' }
    @{ Pattern = '(?i)^Simplify\s';               Category = 'Changed' }
    @{ Pattern = '(?i)^Remov(e|ed)\s';            Category = 'Removed' }
    @{ Pattern = '(?i)^Deprecate\s';              Category = 'Deprecated' }
    @{ Pattern = '(?i)^Fix\s';                    Category = 'Fixed' }
)

function Classify-Commit {
    param([string]$Subject)

    # Detect breaking change markers
    $isBreaking = $Subject -match '(?i)^[a-z]+(\(.+\))?!:' -or $Subject -match 'BREAKING CHANGE'

    # Strip breaking marker for classification
    $cleaned = $Subject -replace '(?i)^([a-z]+)(\(.+\))?!:', '$1$2:'

    # Try each rule
    $category = 'Changed'
    $message = $cleaned
    foreach ($rule in $classificationRules) {
        if ($cleaned -match $rule.Pattern) {
            $category = $rule.Category
            # Strip conventional commit prefix (type(scope): )
            if ($cleaned -match '(?i)^[a-z]+(\(.+\))?:\s*') {
                $message = $cleaned -replace '(?i)^[a-z]+(\(.+\))?:\s*', ''
            }
            break
        }
    }

    # Capitalize first letter
    if ($message.Length -gt 0) {
        $message = $message.Substring(0, 1).ToUpper() + $message.Substring(1)
    }

    # Add breaking prefix
    if ($isBreaking) {
        $message = "**BREAKING** $message"
    }

    return [PSCustomObject]@{
        Category   = $category
        Message    = $message
        IsBreaking = $isBreaking
        IsFeature  = ($category -eq 'Added')
    }
}

# --- Classify all commits ---
$categories = [ordered]@{
    'Added'      = [System.Collections.Generic.List[string]]::new()
    'Changed'    = [System.Collections.Generic.List[string]]::new()
    'Deprecated' = [System.Collections.Generic.List[string]]::new()
    'Removed'    = [System.Collections.Generic.List[string]]::new()
    'Fixed'      = [System.Collections.Generic.List[string]]::new()
    'Security'   = [System.Collections.Generic.List[string]]::new()
}
$hasBreaking = $false
$hasFeature  = $false
$seen = [System.Collections.Generic.HashSet[string]]::new()

foreach ($subject in $commits) {
    $result = Classify-Commit -Subject $subject
    if ($seen.Add($result.Message)) {
        $categories[$result.Category].Add("- $($result.Message)")
        if ($result.IsBreaking) { $hasBreaking = $true }
        if ($result.IsFeature)  { $hasFeature  = $true }
    }
}

# --- Build the Unreleased section ---
$sb = [System.Text.StringBuilder]::new()
[void]$sb.AppendLine("## [Unreleased]")
[void]$sb.AppendLine()

foreach ($cat in $categories.Keys) {
    if ($categories[$cat].Count -gt 0) {
        [void]$sb.AppendLine("### $cat")
        [void]$sb.AppendLine()
        foreach ($item in $categories[$cat]) {
            [void]$sb.AppendLine($item)
        }
        [void]$sb.AppendLine()
    }
}

# --- Update the changelog file ---
$changelogPath = Join-Path $ScriptDir 'apps/android/aardflex/v1.0/CHANGELOG.md'

if (-not (Test-Path $changelogPath)) {
    Write-Host "Error: Changelog not found at $changelogPath" -ForegroundColor Red
    Pop-Location
    exit 1
}

$content = Get-Content $changelogPath -Raw

if ($content -notmatch '## \[Unreleased\]') {
    Write-Host "Error: No ## [Unreleased] section found in $changelogPath" -ForegroundColor Red
    Pop-Location
    exit 1
}

# Replace from ## [Unreleased] up to the next ## [ or end of file
$pattern = '(?ms)^## \[Unreleased\].*?(?=^## \[|\z)'
$newContent = $content -replace $pattern, $sb.ToString()

Set-Content -Path $changelogPath -Value $newContent -NoNewline

# --- Smart version suggestion ---
if ($hasBreaking) {
    $suggestedMajor = $major + 1
    $suggested = "v$suggestedMajor.0.0"
    $reason = "BREAKING changes detected"
} elseif ($hasFeature) {
    $suggestedMinor = $minor + 1
    $suggested = "v$major.$suggestedMinor.0"
    $reason = "New features detected"
} else {
    $nextPatch = $patch + 1
    $suggested = "v$major.$minor.$nextPatch"
    $reason = "Bug fixes / maintenance only"
}

# --- Summary ---
Write-Host ""
Write-Host "Changelog updated: $changelogPath" -ForegroundColor Green
foreach ($cat in $categories.Keys) {
    $count = $categories[$cat].Count
    if ($count -gt 0) {
        Write-Host "  $cat`: $count entries" -ForegroundColor White
    }
}
Write-Host ""
Write-Host "Suggested next version: $suggested ($reason)" -ForegroundColor Cyan

Pop-Location
