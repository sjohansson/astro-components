#!/usr/bin/env pwsh
# Auto-fix common issues: format and lint
# Run this before committing: .\scripts\fix.ps1

Write-Host "🔧 Running auto-fix..." -ForegroundColor Cyan

# Format code
Write-Host ""
Write-Host "✨ Formatting code..." -ForegroundColor Yellow
pnpm lint:fix
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Formatting failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Auto-fix complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Review the changes made"
Write-Host "  2. Run: .\scripts\pre-commit.ps1"
Write-Host "  3. Commit when all checks pass"
