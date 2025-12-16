#!/usr/bin/env pwsh
# Full build, test, and check workflow
# Run this before releases or major PRs: .\scripts\full-check.ps1

Write-Host "🚀 Running full verification workflow..." -ForegroundColor Cyan

$failed = $false

# Clean
Write-Host ""
Write-Host "🧹 Cleaning previous builds..." -ForegroundColor Yellow
pnpm clean
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Clean failed" -ForegroundColor Red
    $failed = $true
} else {
    Write-Host "✅ Clean completed" -ForegroundColor Green
}

# Install
Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
pnpm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Install failed" -ForegroundColor Red
    $failed = $true
} else {
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
}

# Build
Write-Host ""
Write-Host "🔨 Building packages..." -ForegroundColor Yellow
pnpm build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    $failed = $true
} else {
    Write-Host "✅ Build successful" -ForegroundColor Green
}

# Lint
Write-Host ""
Write-Host "📋 Linting code..." -ForegroundColor Yellow
pnpm lint
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Linting failed" -ForegroundColor Red
    $failed = $true
} else {
    Write-Host "✅ Linting passed" -ForegroundColor Green
}

# Type check
Write-Host ""
Write-Host "🔤 Type checking..." -ForegroundColor Yellow
pnpm typecheck
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Type checking failed" -ForegroundColor Red
    $failed = $true
} else {
    Write-Host "✅ Type checking passed" -ForegroundColor Green
}

# Tests
Write-Host ""
Write-Host "🧪 Running tests..." -ForegroundColor Yellow
pnpm test run
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Tests failed" -ForegroundColor Red
    $failed = $true
} else {
    Write-Host "✅ Tests passed" -ForegroundColor Green
}

# Coverage
Write-Host ""
Write-Host "📊 Generating coverage..." -ForegroundColor Yellow
pnpm test:coverage
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Coverage generation had issues (non-critical)" -ForegroundColor Yellow
} else {
    Write-Host "✅ Coverage report generated" -ForegroundColor Green
}

# Summary
Write-Host ""
if ($failed) {
    Write-Host "❌ Full verification failed. Review errors above." -ForegroundColor Red
    exit 1
} else {
    Write-Host "✨ Full verification passed! Everything is ready." -ForegroundColor Green
    exit 0
}
