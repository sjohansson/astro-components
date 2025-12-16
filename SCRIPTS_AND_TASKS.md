# PowerShell Script Helpers & VS Code Tasks

This project uses **manual PowerShell scripts and VS Code tasks** for quality checks instead of unreliable Git hooks (which don't work consistently on Windows).

## Why Not Git Hooks?

Git hooks on Windows have notorious issues:
- ❌ VS Code's git integration bypasses shell hooks
- ❌ Unreliable execution from VS Code's Source Control UI
- ❌ Path resolution issues with pnpm on Windows
- ❌ Husky and simple-git-hooks have Windows-specific problems

**Solution:** Manual scripts you control + VS Code tasks = reliable, predictable behavior.

## Available Scripts

All scripts are in the `scripts/` directory. Run them before committing.

### `scripts\fix.ps1` - Auto-Fix Issues
```powershell
.\scripts\fix.ps1
```
**What it does:**
- Formats code with Biome
- Auto-fixes linting issues
- Handles all fixable code problems

**When to use:** Before committing to automatically fix style issues.

**Time:** ~10 seconds

### `scripts\pre-commit.ps1` - Pre-Commit Checks
```powershell
.\scripts\pre-commit.ps1
```
**What it does:**
- Lints code with Biome
- Type checks with TypeScript
- Runs all tests
- Reports failures clearly

**When to use:** Before every commit to ensure code quality.

**Time:** ~30-60 seconds

**Exit codes:**
- `0` = All checks passed ✅
- `1` = Checks failed ❌

### `scripts\full-check.ps1` - Full Verification
```powershell
.\scripts\full-check.ps1
```
**What it does:**
- Clean previous builds
- Install dependencies
- Build all packages
- Lint code
- Type check
- Run tests
- Generate coverage

**When to use:** Before releases or major PRs; before pushing to main.

**Time:** ~2-5 minutes (first time) or ~30 seconds (cached)

## Using VS Code Tasks

Instead of opening PowerShell separately, run scripts directly from VS Code.

### Open Task Menu
Press `Ctrl+Shift+B` (Windows) or `Cmd+Shift+B` (Mac)

### Available Tasks
1. **Pre-commit checks** - Run before every commit
2. **Auto-fix issues** - Format and fix code
3. **Full verification** - Comprehensive check
4. **Build packages** - Build only
5. **Run tests** - Run tests with watch mode
6. **Lint code** - Lint only
7. **Type check** - Type check only

### Workflow Example

```
1. Make changes
2. Press Ctrl+Shift+B → Select "Auto-fix issues"
3. Review changes
4. Press Ctrl+Shift+B → Select "Pre-commit checks"
5. If all pass, commit
```

## Manual Command Line

You can also run commands directly:

```powershell
# Quick fixes
pnpm lint:fix

# Full checks
pnpm check              # lint + typecheck + test

# Individual checks
pnpm lint               # Lint only
pnpm typecheck          # Type check only
pnpm test run           # Tests only
pnpm test:ui            # Tests with UI (debugging)
pnpm test:coverage      # Tests with coverage

# Building
pnpm build              # Build all packages
pnpm dev                # Dev mode with watch
```

## Best Practices

### Before Every Commit
1. Run `.\scripts\pre-commit.ps1` (or use VS Code task)
2. Review any failures
3. Fix issues (use `.\scripts\fix.ps1` for auto-fixes)
4. Run checks again until all pass
5. Commit

### Before Creating a PR
1. Run `.\scripts\pre-commit.ps1`
2. Ensure all checks pass
3. Push your branch
4. Create PR on GitHub

### Before Releasing
1. Run `.\scripts\full-check.ps1`
2. Ensure everything passes
3. Create changeset: `pnpm changeset`
4. Commit changeset
5. Push to main

## Troubleshooting

### Script Won't Run
**Issue:** "cannot be loaded because running scripts is disabled"

**Fix:** Enable script execution
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Task Won't Execute
**Issue:** Task shows error when run from VS Code

**Fix:** 
1. Open PowerShell manually
2. Navigate to project root
3. Run script directly: `.\scripts\pre-commit.ps1`
4. Check for error messages

### Slow Performance
**Issue:** Tasks take too long

**Solution:**
- First run is slow (builds dependencies) - subsequent runs are fast
- Use `pnpm test` instead of `pnpm test run` for watch mode
- Use specific tasks instead of `full-check.ps1` for quick checks

### Linting Fails But VS Code Shows No Errors
**Issue:** Biome CLI fails but VS Code extension doesn't show errors

**Solution:**
1. Install Biome extension: `biomejs.biome`
2. Reload VS Code
3. Check extension output for detailed errors
4. Run `pnpm lint` to see exact failures

## Integration with GitHub Actions

Local scripts match the CI pipeline:
- **CI workflow** (`.github/workflows/ci.yml`) runs the same checks on every PR
- **Pre-commit script** = GitHub CI checks
- If your code passes locally, it should pass CI

## Tips for Windows Development

### Enable Format on Save
Add to `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "biomejs.biome"
}
```
This auto-fixes formatting issues as you type.

### Keyboard Shortcuts
Create custom shortcuts in VS Code:
1. Press `Ctrl+K Ctrl+S` (keyboard shortcuts)
2. Search for "Tasks: Run Task"
3. Add shortcut like `Ctrl+Alt+C` for quick access

### Performance Tips
- Keep VS Code integrated terminal open
- Run `pnpm test` in background terminal (watch mode)
- Use `pnpm test:ui` for interactive debugging
- Run `pnpm dev` to rebuild as you code

## Summary

| Task | Command | Time |
|------|---------|------|
| Auto-fix code | `.\scripts\fix.ps1` or Ctrl+Shift+B | ~10s |
| Pre-commit check | `.\scripts\pre-commit.ps1` or Ctrl+Shift+B | ~30-60s |
| Full verification | `.\scripts\full-check.ps1` or Ctrl+Shift+B | ~2-5min |
| Quick lint | `pnpm lint` | ~5s |
| Quick tests | `pnpm test` | ~10s (watch) |
| Quick type check | `pnpm typecheck` | ~3s |

**Remember:** Always run pre-commit checks before committing! ✅
