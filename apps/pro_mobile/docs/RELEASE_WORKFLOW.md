# Release Workflow Guide

Quick reference for releasing the mobile app using GitHub Actions.

## 🚀 Quick Start

1. **Go to GitHub Actions**
   - Navigate to: `https://github.com/[your-org]/[your-repo]/actions`
   - Find workflow: **"Pro Mobile Release"**

2. **Click "Run workflow"**

3. **Fill in the form:**
   - **Version type:** `patch` / `minor` / `major`
   - **Platform:** `all` / `ios` / `android`
   - **Publish OTA:** `true` (recommended) / `false`

4. **Click "Run workflow"**

5. **Monitor the workflow:**
   - Watch the progress in real-time
   - Check for any errors
   - Verify the release was created

## 📋 What Happens Automatically

The workflow will:

1. ✅ **Bump version** in `app.json` and `package.json`
2. ✅ **Update build numbers** (Android `versionCode`, iOS `buildNumber`)
3. ✅ **Create git commit** with version changes
4. ✅ **Create git tag** (e.g., `v1.0.1`)
5. ✅ **Push changes** to `main` branch
6. ✅ **Build production app(s)** via EAS
7. ✅ **Publish OTA update** to `production` branch (if enabled)
8. ✅ **Create GitHub release** with changelog

## 🎯 Version Types

- **`patch`**: Bug fixes (1.0.0 → 1.0.1)
- **`minor`**: New features (1.0.0 → 1.1.0)
- **`major`**: Breaking changes (1.0.0 → 2.0.0)

## 📱 Platform Options

- **`all`**: Build both iOS and Android (recommended for releases)
- **`ios`**: Build iOS only
- **`android`**: Build Android only

## 🔄 OTA Updates

- **`true`**: Publishes OTA update to `production` branch
  - Users with the app will receive JavaScript updates automatically
  - No app store review needed for JS changes
  
- **`false`**: Skips OTA update
  - Only creates native builds
  - Use when you need a new native build but don't want to push OTA

## ⚠️ Prerequisites

Before running the release workflow:

- [ ] All tests passing
- [ ] Code reviewed and merged to `main`
- [ ] Ready for production release
- [ ] `EXPO_TOKEN` secret configured in GitHub

## 🔍 After Release

1. **Check GitHub Release:**
   - Go to Releases page
   - Verify version and changelog
   - Download build artifacts if needed

2. **Verify EAS Builds:**
   - Check [EAS Dashboard](https://expo.dev)
   - Confirm builds completed successfully
   - Download builds if needed for manual submission

3. **Submit to App Stores** (if applicable):
   - Use EAS Submit or manual submission
   - Link to the GitHub release for reference

4. **Monitor OTA Updates:**
   - Check OTA update status in EAS Dashboard
   - Monitor adoption rate
   - Verify updates are being received

## 🐛 Troubleshooting

### Workflow fails at "Bump version"

- **Check:** Are you on `main` branch?
- **Check:** Are there uncommitted changes?
- **Fix:** Ensure `main` is clean and up to date

### Workflow fails at "Push version changes"

- **Check:** Does the workflow have write permissions?
- **Check:** Is `GITHUB_TOKEN` properly configured?
- **Fix:** Verify workflow permissions in repository settings

### Build fails

- **Check:** EAS credentials configured?
- **Check:** `EXPO_TOKEN` secret set correctly?
- **Check:** Build profile configuration in `eas.json`
- **Fix:** Review EAS build logs for specific errors

### OTA update not publishing

- **Check:** Is `publish_ota` set to `true`?
- **Check:** Is `updates` configured in `app.json`?
- **Check:** EAS project ID correct?
- **Fix:** Verify EAS configuration and try manual publish

## 📚 Related Documentation

- [Versioning Guide](./VERSIONING.md) - Detailed versioning strategy
- [EAS Build Guide](./EAS_BUILD_AND_DEPLOYMENT.md) - Build configuration
- [OTA Updates](./EAS_BUILD_AND_DEPLOYMENT.md#ota-updates) - OTA update details

## 💡 Tips

- **Always test preview builds** before production releases
- **Use patch releases** for hotfixes
- **Use minor releases** for new features
- **Use major releases** sparingly (breaking changes)
- **Enable OTA updates** for faster user updates
- **Monitor release metrics** in EAS Dashboard
