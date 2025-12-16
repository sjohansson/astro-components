#!/usr/bin/env pwsh
# Pre-commit checks: lint, format, type check, and test
# Run this before committing: .\scripts\pre-commit.ps1

Write-Host "🔍 Running pre-commit checks..." -ForegroundColor Cyan

$failed = $false

# Lint check
Write-Host ""
Write-Host "📋 Linting with Biome..." -ForegroundColor Yellow
pnpm lint
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Linting failed" -ForegroundColor Red
    $failed = $true
} else {
    Write-Host "✅ Linting passed" -ForegroundColor Green
}

# Type check
Write-Host ""
Write-Host "🔤 Type checking with TypeScript..." -ForegroundColor Yellow
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

# Summary
Write-Host ""
if ($failed) {
    Write-Host "❌ Pre-commit checks failed. Fix issues before committing." -ForegroundColor Red
    exit 1
} else {
    Write-Host "✨ All pre-commit checks passed! Ready to commit." -ForegroundColor Green
    exit 0
}
