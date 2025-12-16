# PowerShell Setup for Windows Development

## Prerequisites

Ensure PowerShell execution policy allows running scripts.

### Check Current Policy
```powershell
Get-ExecutionPolicy
```

### Set Execution Policy (If Needed)
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

This allows running local scripts while still protecting against untrusted scripts.

## Setting Up

### 1. Open PowerShell as Regular User
Don't need admin. Open Terminal or PowerShell in VS Code.

### 2. Navigate to Project Root
```powershell
cd c:\repos\github\sjohansson\astro-components
```

### 3. Run Script Directly
```powershell
.\scripts\fix.ps1
```

### 4. Or Use from VS Code
Press `Ctrl+Shift+B` and select task.

## Common Commands

### Auto-Fix Code
```powershell
.\scripts\fix.ps1
```

### Check Before Commit
```powershell
.\scripts\pre-commit.ps1
```

### Full Verification
```powershell
.\scripts\full-check.ps1
```

### Watch Mode (Development)
```powershell
pnpm dev
```

### Run Tests Interactively
```powershell
pnpm test:ui
```

## Creating a PowerShell Profile

Optional: Streamline common commands.

### 1. Create Profile Directory
```powershell
if (!(Test-Path -Path $PROFILE)) {
    New-Item -ItemType File -Path $PROFILE -Force
}
```

### 2. Edit Profile
```powershell
code $PROFILE
```

### 3. Add Aliases
```powershell
# Project shortcuts
Set-Alias -Name "check-commit" -Value "C:\repos\github\sjohansson\astro-components\scripts\pre-commit.ps1"
Set-Alias -Name "fix-code" -Value "C:\repos\github\sjohansson\astro-components\scripts\fix.ps1"
Set-Alias -Name "verify" -Value "C:\repos\github\sjohansson\astro-components\scripts\full-check.ps1"

# pnpm aliases
Set-Alias -Name "pn" -Value "pnpm"
```

### 4. Reload Profile
```powershell
. $PROFILE
```

Now you can run:
```powershell
fix-code          # Auto-fix
check-commit      # Pre-commit checks
verify            # Full verification
```

## VS Code Integration

### 1. Open Integrated Terminal
- `Ctrl+`` (backtick) to open
- Or use Terminal menu

### 2. Run Tasks
- `Ctrl+Shift+B` opens task menu
- Select a task to run

### 3. Make Tasks Easier
Create keyboard shortcuts:
1. Press `Ctrl+K Ctrl+S` (keyboard shortcuts)
2. Search: "Tasks: Run Task"
3. Add shortcut (e.g., `Ctrl+Alt+T`)

## Troubleshooting

### "cannot be loaded because running scripts is disabled"
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### "pnpm: The term 'pnpm' is not recognized"
Ensure pnpm is installed globally:
```powershell
npm install -g pnpm
```

### Script runs but shows no output
The script may have an error. Run with error details:
```powershell
.\scripts\pre-commit.ps1 *>&1
```

### VS Code task won't run
1. Ensure PowerShell is set as default terminal:
   - Open VS Code settings (`Ctrl+,`)
   - Search "terminal.integrated.defaultProfile.windows"
   - Set to "PowerShell"

2. Close and reopen VS Code

3. Try again via terminal or task menu

## Best Practices

✅ **Always run pre-commit checks before committing**
```powershell
.\scripts\pre-commit.ps1
```

✅ **Use auto-fix to format code**
```powershell
.\scripts\fix.ps1
```

✅ **Run full check before releases**
```powershell
.\scripts\full-check.ps1
```

✅ **Keep pnpm updated**
```powershell
pnpm install -g pnpm@latest
```

✅ **Use watch mode during development**
```powershell
pnpm dev
```

## Performance Tips

### First Run (Slow)
Installing dependencies takes 30-60 seconds. This is normal.

### Subsequent Runs (Fast)
Cached dependencies make checks fast:
- `fix.ps1`: ~10 seconds
- `pre-commit.ps1`: ~30-60 seconds
- `full-check.ps1`: ~30-45 seconds (after first run)

### Speed Up Tests
Use watch mode instead of running tests every time:
```powershell
pnpm test
```
Keep this running in background, tests re-run as you code.

### Speed Up Dev Build
Use dev mode:
```powershell
pnpm dev
```
Rebuilds packages as you change files.

## Summary

| Task | Command | Time |
|------|---------|------|
| Format code | `.\scripts\fix.ps1` | ~10s |
| Pre-commit | `.\scripts\pre-commit.ps1` | ~30-60s |
| Full check | `.\scripts\full-check.ps1` | ~30-45s |
| Watch tests | `pnpm test` | ~10s (starts) |
| Dev mode | `pnpm dev` | ~5s (starts) |

---

**Ready to develop!** Follow the scripts guide for your workflow. 🚀
