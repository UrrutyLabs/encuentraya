# Mobile App Versioning Guide

This document explains how versioning works for the mobile app and when to bump versions.

## Version Structure

The app uses a three-level versioning system:

1. **Version** (`1.0.0`) - User-facing semantic version
2. **Runtime Version** (`1.0.0`) - Used for OTA updates (auto-synced with version)
3. **Build Numbers** - Platform-specific, auto-incremented by EAS

## Files Updated by Version Bump

The app uses **[standard-version-expo](https://github.com/expo-community/standard-version-expo)** to automatically update:

- `app.json` → `expo.version`
- `app.json` → `expo.android.versionCode` (incremented)
- `app.json` → `expo.ios.buildNumber` (incremented)
- `package.json` → `version`
- `CHANGELOG.md` → Auto-generated changelog (optional)

## When to Run Version Bump

### ✅ **Run BEFORE Production Releases**

The version bump should be run **manually** before creating a production build:

```bash
# For a patch release (bug fixes)
pnpm release:patch

# For a minor release (new features)
pnpm release:minor

# For a major release (breaking changes)
pnpm release:major

# Or let standard-version determine the version from Conventional Commits
pnpm release
```

**Note:** `standard-version` analyzes your git commit history using [Conventional Commits](https://www.conventionalcommits.org/) to determine the version bump type automatically.

### 📋 **Typical Workflow**

#### **Option A: GitHub Actions Release Workflow (Recommended)**

1. **Go to GitHub Actions:**
   - Navigate to Actions → "Release Mobile App"
   - Click "Run workflow"
   - Select:
     - Version type: `patch` / `minor` / `major`
     - Platform: `all` / `ios` / `android`
     - Publish OTA: `true` (recommended)
   - Click "Run workflow"

2. **Workflow automatically:**
   - ✅ Bumps version in `app.json` and `package.json`
   - ✅ Updates Android `versionCode` and iOS `buildNumber`
   - ✅ Creates git commit and tag
   - ✅ Builds production app(s)
   - ✅ Publishes OTA update to production branch
   - ✅ Creates GitHub release

**That's it!** Everything is automated.

#### **Option B: Manual Workflow**

1. **Before Production Release:**
   ```bash
   # 1. Bump version (standard-version handles everything)
   cd apps/pro_mobile
   pnpm release:patch  # or release:minor/release:major
   
   # standard-version will:
   # - Update app.json (version, versionCode, buildNumber)
   # - Update package.json (version)
   # - Generate/update CHANGELOG.md
   # - Create a git commit
   # - Create a git tag
   
   # 2. Push changes and tags
   git push && git push --tags
   ```

2. **Trigger Production Build:**
   - Use GitHub Actions "Pro Mobile Build and Deploy" workflow with `profile: production`
   - Or run locally: `eas build --platform all --profile production`

3. **After Build Completes:**
   - Submit to app stores (if using EAS Submit)
   - Publish OTA updates: `eas update --branch production`

### ❌ **Do NOT Run For:**

- **Preview builds** (PR builds) - These use the current version
- **Development builds** - No version bump needed
- **OTA updates** - Version stays the same, only JavaScript changes

## Version Bump Scenarios

### Scenario 1: Bug Fix Release
```bash
# Current: 1.0.0 → New: 1.0.1
pnpm release:patch
```

### Scenario 2: New Feature Release
```bash
# Current: 1.0.0 → New: 1.1.0
pnpm release:minor
```

### Scenario 3: Breaking Change Release
```bash
# Current: 1.0.0 → New: 2.0.0
pnpm release:major
```

### Scenario 4: Automatic Version Detection
```bash
# standard-version analyzes commit history and determines version bump
# Based on Conventional Commits (feat:, fix:, BREAKING CHANGE:, etc.)
pnpm release
```

## Conventional Commits

`standard-version` uses [Conventional Commits](https://www.conventionalcommits.org/) to determine version bumps:

- `feat:` → Minor version bump (1.0.0 → 1.1.0)
- `fix:` → Patch version bump (1.0.0 → 1.0.1)
- `BREAKING CHANGE:` or `!` → Major version bump (1.0.0 → 2.0.0)

**Example commits:**
```bash
git commit -m "feat: add earnings dashboard"
git commit -m "fix: resolve booking status bug"
git commit -m "feat!: redesign navigation (BREAKING CHANGE)"
```

## Build Number Management

Build numbers are **automatically managed** by EAS:

- **iOS `buildNumber`**: Auto-incremented by EAS when `autoIncrement: true` in `eas.json`
- **Android `versionCode`**: Auto-incremented by EAS when `autoIncrement: true` in `eas.json`

You **don't need to manually update** build numbers - EAS handles this for production builds.

## Runtime Version for OTA Updates

The `runtimeVersion` is automatically set to match the `version` via the `appVersion` policy:

```json
{
  "runtimeVersion": {
    "policy": "appVersion"
  }
}
```

This means:
- All OTA updates published for version `1.0.0` will only apply to apps built with version `1.0.0`
- When you bump to `1.0.1` and create a new build, that build will only receive OTA updates for `1.0.1`

## CI/CD Integration

### Option 1: GitHub Actions Release Workflow (Recommended)

**Automated release workflow** that handles version bumping, building, and OTA publishing in one step.

**How it works:**
1. Go to GitHub Actions → "Pro Mobile Release" workflow
2. Click "Run workflow"
3. Select version type (patch/minor/major)
4. Choose platform (iOS/Android/all)
5. Optionally enable OTA update publishing
6. The workflow will:
   - Bump version using `standard-version`
   - Commit and tag the changes
   - Build production app(s)
   - Publish OTA update (if enabled)
   - Create GitHub release

**Pros:**
- ✅ Fully automated end-to-end
- ✅ Single workflow for entire release
- ✅ Creates GitHub release automatically
- ✅ Still requires manual trigger (control)
- ✅ Handles git commits/tags automatically

**Cons:**
- Requires GitHub Actions write permissions
- Version bump commit happens in CI (less reviewable)

**Usage:**
```bash
# Via GitHub UI:
# 1. Go to Actions → "Pro Mobile Release"
# 2. Click "Run workflow"
# 3. Select options and run

# The workflow handles everything automatically!
```

### Option 2: Manual Version Bump (Alternative)

**Manual approach:** Run version bump locally, then trigger build.

**Workflow:**
```bash
# 1. Bump version locally
cd apps/pro_mobile
pnpm release:patch  # or release:minor/release:major

# 2. Push changes
git push && git push --tags

# 3. Trigger build via mobile-build workflow
# (via GitHub Actions workflow_dispatch)
```

**Pros:**
- Full control over version bump
- Can review version changes before pushing
- Version commit happens locally

**Cons:**
- Requires manual steps
- Two-step process (version → build)

### Option 3: Automated on Git Tags

You could add a CI step that bumps version when a git tag is pushed:

```yaml
# In .github/workflows/mobile-build.yml
- name: Bump version on tag
  if: startsWith(github.ref, 'refs/tags/v')
  run: |
    cd apps/pro_mobile
    # Extract version from tag (e.g., v1.0.1 -> 1.0.1)
    VERSION=${GITHUB_REF#refs/tags/v}
    pnpm bump-version $VERSION
```

**Note:** **Option 1 (GitHub Actions Release Workflow)** is recommended for streamlined releases.

## Release Checklist

### Using GitHub Actions Release Workflow:

**Before triggering release:**
- [ ] All tests passing
- [ ] Code reviewed and merged to `main`
- [ ] Ready for production release

**After triggering release:**
- [ ] Monitor workflow execution
- [ ] Verify version bump in `app.json`
- [ ] Check GitHub release was created
- [ ] Verify builds completed successfully
- [ ] Confirm OTA update published (if enabled)
- [ ] Submit to app stores (if applicable)

### Using Manual Workflow:

**Before running `pnpm release`:**
- [ ] All tests passing
- [ ] Code reviewed and merged to `main`
- [ ] Commits follow Conventional Commits format
- [ ] Ready for production release

**After running `pnpm release`:**
- [ ] Review generated CHANGELOG.md (if enabled)
- [ ] Push changes and tags: `git push && git push --tags`
- [ ] Trigger production build
- [ ] Submit to app stores (if applicable)
- [ ] Publish OTA update for the new version

## Examples

### Example 1: GitHub Actions Release (Recommended)

**Via GitHub UI:**
1. Go to Actions → "Pro Mobile Release"
2. Click "Run workflow"
3. Select:
   - Version type: `patch`
   - Platform: `all`
   - Publish OTA: `true`
4. Click "Run workflow"

**Result:**
- Version: `1.0.0` → `1.0.1`
- Android `versionCode`: `1` → `2`
- iOS `buildNumber`: `"1"` → `"2"`
- Git tag: `v1.0.1` created
- Production builds: iOS & Android
- OTA update: Published to `production` branch
- GitHub release: Created automatically

### Example 2: Manual Patch Release

```bash
# Current version: 1.0.0
cd apps/pro_mobile
pnpm release:patch
# → Updates to 1.0.1
# → Updates Android versionCode (1 → 2)
# → Updates iOS buildNumber ("1" → "2")
# → Creates commit and tag v1.0.1

git push && git push --tags

# Then trigger production build via GitHub Actions
```

### Example 3: Manual Minor Release

```bash
# Current version: 1.0.0
cd apps/pro_mobile
pnpm release:minor
# → Updates to 1.1.0
# → Updates Android versionCode (1 → 2)
# → Updates iOS buildNumber ("1" → "2")
# → Creates commit and tag v1.1.0

git push && git push --tags
```

### Example 4: Automatic Version Detection (Manual Only)

```bash
# Make sure your commits follow Conventional Commits:
git commit -m "feat: add new booking feature"
git commit -m "fix: resolve payment bug"

# Then run:
pnpm release
# → Automatically determines version bump based on commit types
# → If you have feat: commits → minor bump
# → If you have fix: commits → patch bump
# → If you have BREAKING CHANGE → major bump
```

## Troubleshooting

### Version not updating?

- Make sure you're in the `apps/pro_mobile` directory
- Check that `app.json` and `package.json` are writable
- Verify the version format is correct (e.g., `1.0.0`)
- Run with `--dry-run` first: `pnpm release --dry-run` to preview changes

### Build numbers not incrementing?

- Check that `autoIncrement: true` is set in `eas.json` for the production profile
- Build numbers only increment for production builds
- Preview/development builds don't auto-increment

### OTA updates not applying?

- Verify `runtimeVersion` matches the build's version
- Check that the update branch matches your build profile
- Ensure `updates.enabled: true` in `app.json`

## Related Documentation

- [EAS Build and Deployment Guide](./EAS_BUILD_AND_DEPLOYMENT.md)
- [OTA Updates](./EAS_BUILD_AND_DEPLOYMENT.md#ota-updates)
- [standard-version-expo](https://github.com/expo-community/standard-version-expo)
- [Conventional Commits](https://www.conventionalcommits.org/)
