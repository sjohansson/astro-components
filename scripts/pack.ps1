#!/usr/bin/env pwsh
# Pack one or all packages into tarballs for local testing.
#
# Usage:
#   .\scripts\pack.ps1                      # pack all packages
#   .\scripts\pack.ps1 astro-theme-toggle   # pack a specific package
#
# Tarballs are written to ./tarballs/ at the repo root.
# Install in another project with:
#   npm install /path/to/tarballs/sjohansson-astro-theme-toggle-0.0.1.tgz

param(
    [string]$Package
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$packagesDir = Join-Path $repoRoot "packages"
$outDir = Join-Path $repoRoot "tarballs"

# Determine which packages to build
if ($Package) {
    $packageDirs = @(Join-Path $packagesDir $Package)
    if (-not (Test-Path $packageDirs[0])) {
        Write-Host "Package not found: $Package" -ForegroundColor Red
        Write-Host "Available packages:" -ForegroundColor Yellow
        Get-ChildItem $packagesDir -Directory | ForEach-Object { Write-Host "  $($_.Name)" }
        exit 1
    }
} else {
    $packageDirs = Get-ChildItem $packagesDir -Directory | Select-Object -ExpandProperty FullName
}

# Build first
Write-Host "Building packages..." -ForegroundColor Cyan
Push-Location $repoRoot
try {
    if ($Package) {
        pnpm --filter "@sjohansson/$Package" run build
    } else {
        pnpm run build
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Build failed" -ForegroundColor Red
        exit 1
    }
} finally {
    Pop-Location
}

# Create output directory
if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir | Out-Null
}

# Pack each package
$tarballs = @()
foreach ($dir in $packageDirs) {
    $pkgName = Split-Path -Leaf $dir
    Write-Host "Packing $pkgName..." -ForegroundColor Yellow

    Push-Location $dir
    try {
        $output = pnpm pack --pack-destination $outDir 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  Failed to pack $pkgName" -ForegroundColor Red
            Write-Host "  $output" -ForegroundColor Red
            exit 1
        }
        # pnpm pack prints the tarball filename
        $tarball = $output | Select-Object -Last 1
        $tarballs += $tarball
        Write-Host "  -> $tarball" -ForegroundColor Green
    } finally {
        Pop-Location
    }
}

Write-Host ""
Write-Host "Packed $($tarballs.Count) tarball(s) to $outDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "Install in another project with:" -ForegroundColor Yellow
foreach ($t in $tarballs) {
    $fullPath = $t
    Write-Host "  npm install `"$fullPath`""
}
