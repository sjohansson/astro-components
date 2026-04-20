#Requires -Version 7.0
<#
.SYNOPSIS
    Creates a version tag on main and pushes it to origin to trigger a release.
.DESCRIPTION
    - Verifies you are on the main branch and in sync with origin/main
    - Detects the latest semver tag (vX.Y.Z) and suggests the next patch version
    - Lets you edit the suggested version before tagging
    - Creates an annotated tag and pushes it to origin
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

# --- Check sync with origin/main ---
$localSha  = git rev-parse HEAD
$remoteSha = git rev-parse origin/main

if ($localSha -ne $remoteSha) {
    Write-Host "Error: Local main ($($localSha.Substring(0,8))) is not in sync with origin/main ($($remoteSha.Substring(0,8)))." -ForegroundColor Red
    Write-Host "Pull or push first, then try again." -ForegroundColor Yellow
    exit 1
}

# --- Check working tree is clean ---
$status = git status --porcelain
if ($status) {
    Write-Host "Error: Working tree is not clean. Commit or stash changes first." -ForegroundColor Red
    exit 1
}

Write-Host "On main, in sync with origin, working tree clean." -ForegroundColor Green
Write-Host ""

# --- Find latest semver tag ---
$allTags = git tag --sort=-v:refname | Where-Object { $_ -match '^v\d+\.\d+\.\d+$' }

if ($allTags -and $allTags.Count -gt 0) {
    $latestTag = $allTags[0]
    Write-Host "Latest tag: $latestTag" -ForegroundColor Cyan

    # Parse version components
    $version = $latestTag -replace '^v', ''
    $parts = $version.Split('.')
    $major = [int]$parts[0]
    $minor = [int]$parts[1]
    $patch = [int]$parts[2]

    # Suggest next patch
    $nextPatch = $patch + 1
    $suggested = "v$major.$minor.$nextPatch"
} else {
    Write-Host "No existing semver tags found." -ForegroundColor Yellow
    $suggested = "v1.0.0"
}

Write-Host ""
Write-Host "Suggested next version: " -NoNewline
Write-Host $suggested -ForegroundColor Green
Write-Host ""

# --- Let user confirm or edit ---
$taginput = Read-Host "Enter version to tag (press Enter to accept '$suggested')"
if ([string]::IsNullOrWhiteSpace($taginput)) {
    $newTag = $suggested
} else {
    # Normalize: add 'v' prefix if missing
    if (-not $taginput.StartsWith('v')) {
        $taginput = "v$taginput"
    }
    $newTag = $taginput
}

# --- Validate format ---
if ($newTag -notmatch '^v\d+\.\d+\.\d+$') {
    Write-Host "Error: '$newTag' is not a valid semver tag (expected vX.Y.Z)." -ForegroundColor Red
    exit 1
}

# --- Check tag doesn't already exist ---
$existingTag = git tag -l $newTag
if ($existingTag) {
    Write-Host "Error: Tag '$newTag' already exists." -ForegroundColor Red
    exit 1
}

# --- Confirm ---
Write-Host ""
Write-Host "Will create annotated tag: " -NoNewline
Write-Host $newTag -ForegroundColor Yellow
Write-Host "On commit: $($localSha.Substring(0,8)) (main)"
Write-Host ""

$confirm = Read-Host "Proceed? (y/N)"
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "Aborted." -ForegroundColor Yellow
    exit 0
}

# --- Create annotated tag ---
$tagMessage = Read-Host "Tag message (press Enter for default: 'Release $newTag')"
if ([string]::IsNullOrWhiteSpace($tagMessage)) {
    $tagMessage = "Release $newTag"
}

git tag -a $newTag -m $tagMessage
Write-Host "Tag '$newTag' created locally." -ForegroundColor Green

# --- Push tag to origin ---
Write-Host "Pushing tag to origin..." -ForegroundColor Cyan
git push origin $newTag

Write-Host ""
Write-Host "Done! Tag '$newTag' pushed to origin." -ForegroundColor Green
