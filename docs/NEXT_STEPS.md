# 🚀 Next Steps - Setup Checklist

Follow this checklist to complete the setup and start developing your Astro components.

## ✅ Immediate Setup (Required)

### 1. Install Dependencies
```powershell
cd c:\repos\github\sjohansson\astro-components
pnpm install
```
This will install all dependencies for the monorepo and all packages.

### 2. Build All Packages
```powershell
pnpm build
```
Verify that all packages build successfully.

### 3. Run Tests
```powershell
pnpm test run
```
Ensure all tests pass.

### 4. Check Code Quality
```powershell
pnpm check
```
This runs linting, type checking, and tests.

## 🔧 Manual Code Quality Checks (Before Commit)

**Important:** This project uses manual pre-commit checks via PowerShell scripts instead of unreliable Git hooks, which don't work consistently on Windows with VS Code.

### Quick Auto-Fix
```powershell
.\scripts\fix.ps1
```
Automatically formats and fixes all fixable issues.

### Pre-Commit Checks
```powershell
.\scripts\pre-commit.ps1
```
Runs linting, type checking, and tests. **Run this before committing.**

### Full Verification (Before Releases)
```powershell
.\scripts\full-check.ps1
```
Comprehensive check: clean, install, build, lint, type check, test, and coverage.

### VS Code Tasks
Instead of running scripts manually, use VS Code's built-in task runner:
- Press `Ctrl+Shift+B` to access the build task menu
- Select from:
  - "Pre-commit checks" - Run before committing
  - "Auto-fix issues" - Format and fix code
  - "Full verification" - Comprehensive check
  - "Build packages" - Build only
  - "Run tests" - Tests only
  - "Lint code" - Linting only
  - "Type check" - Type checking only

## 📦 NPM Publishing Setup (Before First Release)

### 1. Create/Login to npm Account
```powershell
npm login
```
Enter your npm credentials.

### 2. Verify npm Organization (Optional)
If you want to use a different organization name instead of `@sjohansson`:
- Update the `name` field in all `package.json` files
- Replace `@sjohansson` with your npm username or organization

### 3. Test Local Package Linking
```powershell
# Build a package
pnpm --filter @sjohansson/astro-theme-toggle build

# In another project, link it
cd path\to\test-project
pnpm link c:\repos\github\sjohansson\astro-components\packages\astro-theme-toggle
```

## 🔐 GitHub Setup (For Automated Publishing)

### 1. Generate npm Token
1. Go to https://www.npmjs.com
2. Click on your profile → Access Tokens
3. Generate New Token → Classic Token
4. Select "Automation" type
5. Copy the token

### 2. Add GitHub Secret
1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `NPM_TOKEN`
5. Value: Paste the npm token
6. Click "Add secret"

### 3. Verify GitHub Actions
- Push a commit to trigger CI workflow
- Check the Actions tab to see if workflows run successfully

## 📝 First Development Cycle

### 1. Create a Feature Branch
```powershell
git checkout -b feat/initial-implementation
```

### 2. Implement Your Components
Edit the component files in:
- `packages/astro-theme-toggle/src/`
- `packages/astro-version-note/src/`
- `packages/astro-reactflow/src/`

### 3. Add Tests
Add tests in the respective `test/` or `tests/` folders.

### 4. Run Development Checks
```powershell
# Watch mode for development
pnpm dev

# In another terminal, run tests
pnpm test

# Format and lint
pnpm lint:fix
```

### 4. Commit and Push
```powershell
# After running ./scripts/pre-commit.ps1 and all checks pass
git add .
git commit -m "feat: initial component implementations"
git push origin feat/initial-implementation
```

### 6. Create Pull Request
- Go to GitHub
- Create a pull request
- Wait for CI to pass
- Merge when ready

## 🎯 First Release

### 1. Merge to Main
After your PR is merged, Changesets will automatically:
- Create a "Version Packages" PR
- Update versions in package.json files
- Generate CHANGELOG.md files

### 2. Review Version PR
- Check the version bumps are correct
- Review the changelogs

### 3. Merge Version PR
- Merge the Version PR
- Packages will automatically publish to npm
- GitHub releases will be created

## 🔍 Verification

### Check Everything Works
```powershell
# Clean install
pnpm clean
pnpm install

# Verify builds
pnpm build

# Verify tests
pnpm test run

# Verify linting
pnpm lint

# Verify type checking
pnpm typecheck

# Run all checks
pnpm check
```

## 📚 Documentation to Update

### 1. Update README badges
Edit `README.md` and update any badges with your actual values.

### 2. Add Component Documentation
Use the template at `.github/COMPONENT_README_TEMPLATE.md` to create README files for each component.

### 3. Update Package Metadata
In each `packages/*/package.json`, update:
- `author`
- `repository.url`
- `keywords`
- `description`

### 4. Update License
Edit `LICENSE` file with your name and year.

## 🎨 Customization Options

### Change Package Scope
If not using `@sjohansson`, update all package.json files:
```json
{
  "name": "@your-scope/package-name"
}
```

### Adjust Renovate Schedule
Edit `renovate.json` to change update schedule:
```json
{
  "schedule": ["before 6am on Monday"]
}
```

### Configure Biome Rules
Edit `biome.json` to adjust linting rules to your preferences.

### Customize GitHub Actions
Edit `.github/workflows/ci.yml` and `.github/workflows/release.yml` as needed.

## ⚠️ Common Issues

### Issue: "pnpm not found"
```powershell
npm install -g pnpm
```

### Issue: Build errors
```powershell
pnpm clean
pnpm install
pnpm build
```

### Issue: Type errors
```powershell
pnpm typecheck
```
Fix any TypeScript errors shown.

### Issue: Lint errors
```powershell
pnpm lint:fix
```

### Issue: Git hooks not running
```powershell
pnpm prepare
```

## 📖 Additional Resources

- [SETUP_SUMMARY.md](./SETUP_SUMMARY.md) - Complete project overview
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- [GETTING_STARTED.md](./GETTING_STARTED.md) - Detailed workflow guide
- [.changeset/README.md](./.changeset/README.md) - Changesets documentation

## ✨ You're All Set!

Once you've completed this checklist, you're ready to:
- ✅ Develop components with confidence
- ✅ Automated testing and quality checks
- ✅ Automated dependency updates
- ✅ Automated versioning and publishing
- ✅ Modern tooling and best practices

Happy coding! 🎉
