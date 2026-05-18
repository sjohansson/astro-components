#!/usr/bin/env pwsh
# Run the theming-showcase example locally.
# Performs a full repo check (build + lint + typecheck + tests) at the repo root,
# then starts the Astro dev server in examples/theming-showcase.
# Usage: .\scripts\run-theming-showcase.ps1 [-SkipCheck]

[CmdletBinding()]
param(
    [switch]$SkipCheck
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir
$showcaseDir = Join-Path $repoRoot "examples/theming-showcase"

if (-not (Test-Path $showcaseDir)) {
    Write-Host "❌ Showcase directory not found: $showcaseDir" -ForegroundColor Red
    exit 1
}

Push-Location $repoRoot
try {
    if ($SkipCheck) {
        Write-Host "⏭️  Skipping full check (per -SkipCheck flag)" -ForegroundColor Yellow
    }
    else {
        Write-Host "🔎 Running full check at repo root: $repoRoot" -ForegroundColor Cyan
        & (Join-Path $scriptDir "full-check.ps1")
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Full check failed — aborting dev server start." -ForegroundColor Red
            exit $LASTEXITCODE
        }
    }
}
finally {
    Pop-Location
}

Push-Location $showcaseDir
try {
    Write-Host ""
    Write-Host "🚀 Starting Astro dev server in: $showcaseDir" -ForegroundColor Cyan
    Write-Host "   (Ctrl+C to stop)" -ForegroundColor DarkGray
    Write-Host ""
    pnpm dev
    exit $LASTEXITCODE
}
finally {
    Pop-Location
}
