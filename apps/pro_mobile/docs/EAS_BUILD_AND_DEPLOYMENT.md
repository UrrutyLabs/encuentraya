# EAS Build and Deployment Guide

Complete guide for building and deploying the EncuentraYa Pros mobile app using Expo Application Services (EAS).

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Project Configuration](#project-configuration)
4. [Environment Variables & Secrets](#environment-variables--secrets)
5. [Build Profiles](#build-profiles)
6. [Building Apps](#building-apps)
7. [iOS Setup & Deployment](#ios-setup--deployment)
8. [Android Setup & Deployment](#android-setup--deployment)
9. [OTA Updates](#ota-updates)
10. [CI/CD Integration](#cicd-integration)
11. [Troubleshooting](#troubleshooting)

---

## Overview

This project uses **EAS Build** to create production-ready iOS and Android apps in the cloud, and **EAS Submit** to deploy them to app stores.

### Key Benefits

- **Cloud-based builds**: No need for local Xcode/Android Studio setup
- **Automatic credential management**: EAS handles certificates and provisioning profiles
- **Monorepo support**: Works seamlessly with Turborepo/pnpm workspaces
- **Sentry integration**: Automatic source map and symbol uploads
- **OTA updates**: Push updates without app store review

### Current Configuration

- **Project ID**: `ccb417f7-83dc-4312-b994-dccc8990101e`
- **EAS CLI Version**: `>= 16.28.0`
- **Build Profiles**: `development`, `preview`, `production`

---

## Prerequisites

### 1. Install EAS CLI

```bash
npm install -g eas-cli
# or use npx (no installation needed)
npx eas-cli --version
```

### 2. Create Expo Account

1. Go to https://expo.dev/signup
2. Create an account (or use GitHub/Google OAuth)
3. Create an organization if working with a team

### 3. Login to EAS

```bash
eas login
```

This will open your browser to authenticate.

### 4. Verify Project Connection

```bash
cd apps/pro_mobile
eas whoami
eas project:info
```

---

## Project Configuration

### `eas.json` Structure

The current `eas.json` configuration:

```json
{
  "cli": {
    "version": ">= 16.28.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Configuration Explained

#### CLI Settings

- **`version`**: Minimum EAS CLI version required
- **`appVersionSource`**: Use "remote" to sync version from app stores

#### Build Profiles

**Development** (`development`):

- Creates a development client build
- Includes debugging tools
- For internal testing
- iOS: Simulator builds available
- Android: APK format

**Preview** (`preview`):

- Production-like build for testing
- Internal distribution only
- No debugging tools
- Android: APK format
- iOS: Ad-hoc distribution

**Production** (`production`):

- Store-ready builds
- Auto-increments build numbers
- Optimized and minified
- iOS: App Store distribution
- Android: AAB format for Play Store

### `app.json` Configuration

Key fields for EAS:

```json
{
  "expo": {
    "name": "EncuentraYa Pros",
    "slug": "encuentraya-pros",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.yourcompany.encuentrayapros",
      "buildNumber": "1"
    },
    "android": {
      "package": "com.yourcompany.encuentrayapros",
      "versionCode": 1
    },
    "extra": {
      "eas": {
        "projectId": "ccb417f7-83dc-4312-b994-dccc8990101e"
      }
    }
  }
}
```

**Important Fields**:

- **`bundleIdentifier`** (iOS): Unique identifier (e.g., `com.yourcompany.encuentrayapros`)
- **`package`** (Android): Same as bundleIdentifier format
- **`version`**: Semantic version (e.g., `1.0.0`)
- **`buildNumber`** (iOS): Increments with each build
- **`versionCode`** (Android): Increments with each build

---

## Environment Variables & Secrets

### Required Secrets for Production Builds

Set these using EAS secrets (not in `.env` files):

```bash
# Navigate to app directory
cd apps/pro_mobile

# Sentry Configuration (for crash reporting)
eas secret:create --scope project --name SENTRY_ORG --value your-org-slug
eas secret:create --scope project --name SENTRY_PROJECT --value your-project-name
eas secret:create --scope project --name SENTRY_AUTH_TOKEN --value your-auth-token
eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value https://your-dsn@sentry.io/project-id

# API Configuration
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value https://your-production-api.com

# Supabase Configuration
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value https://your-project.supabase.co
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value your-anon-key
```

### Getting Sentry Auth Token

1. Go to https://sentry.io/settings/account/api/auth-tokens/
2. Click "Create New Token"
3. Name it (e.g., "EAS Build")
4. Select scopes:
   - `project:releases`
   - `org:read`
   - `project:read`
   - `project:write`
5. Copy the token and use it for `SENTRY_AUTH_TOKEN`

### Viewing Secrets

```bash
eas secret:list
```

### Environment Variables per Profile

You can set environment variables per build profile in `eas.json`:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.production.com",
        "NODE_ENV": "production"
      }
    },
    "preview": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.staging.com",
        "NODE_ENV": "development"
      }
    }
  }
}
```

---

## Build Profiles

### Development Build

**Purpose**: Testing with development tools and debugging

```bash
# iOS (Simulator)
eas build --platform ios --profile development

# Android (APK)
eas build --platform android --profile development

# Both
eas build --platform all --profile development
```

**Characteristics**:

- Includes React Native debugger
- Development client included
- Can connect to local Metro bundler
- Not suitable for app store submission

### Preview Build

**Purpose**: Internal testing of production-like builds

```bash
eas build --platform all --profile preview
```

**Characteristics**:

- Production-optimized code
- No debugging tools
- Internal distribution only
- Good for QA testing

### Production Build

**Purpose**: App store submission

```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production

# Both
eas build --platform all --profile production
```

**Characteristics**:

- Fully optimized and minified
- Store-ready format
- Auto-increments build numbers
- Includes Sentry source maps

---

## Building Apps

### Basic Build Commands

```bash
# Build for specific platform and profile
eas build --platform ios --profile production
eas build --platform android --profile production

# Build for both platforms
eas build --platform all --profile production

# Non-interactive mode (for CI/CD)
eas build --platform all --profile production --non-interactive

# Local build (requires native tooling)
eas build --platform ios --profile production --local
```

### Build Options

```bash
# Build with specific message
eas build --platform ios --profile production --message "Fix: Resolved crash issue"

# Build from specific git branch
eas build --platform ios --profile production --branch main

# Build with auto-submit (after build completes)
eas build --platform ios --profile production --auto-submit

# Cancel a running build
eas build:cancel --id <build-id>
```

### Monitoring Builds

1. **Dashboard**: https://expo.dev/accounts/[your-account]/projects/encuentraya-pros/builds
2. **CLI**: `eas build:list`
3. **Status**: `eas build:view <build-id>`

### Build Times

- **iOS**: ~15-25 minutes
- **Android**: ~10-20 minutes
- **Both**: ~20-30 minutes (run in parallel)

---

## iOS Setup & Deployment

### Step 1: Apple Developer Account

1. Enroll at https://developer.apple.com/programs ($99/year)
2. Create an App ID in [App Store Connect](https://appstoreconnect.apple.com)
3. Note your Team ID

### Step 2: Configure Credentials

EAS can manage credentials automatically:

```bash
eas credentials
```

Choose:

- **iOS** → **Production** → **Set up credentials**
- Select **"Let EAS manage credentials"** (recommended)

Or provide your own:

- Distribution certificate (`.p12`)
- Provisioning profile (`.mobileprovision`)

### Step 3: App Store Connect Setup

1. Create app in [App Store Connect](https://appstoreconnect.apple.com)
2. Fill in app information:
   - Name: EncuentraYa Pros
   - Bundle ID: `com.yourcompany.encuentrayapros`
   - Primary Language: Spanish (or your preference)
3. Note the **App Store Connect App ID** (numeric)

### Step 4: Configure Submit in `eas.json`

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCD123456"
      }
    }
  }
}
```

### Step 5: Build iOS App

```bash
eas build --platform ios --profile production
```

### Step 6: Submit to App Store

**Option A: Automatic (Recommended)**

```bash
# Submit latest build
eas submit --platform ios --latest

# Submit specific build
eas submit --platform ios --id <build-id>
```

**Option B: Manual**

1. Download `.ipa` from EAS dashboard
2. Use [Transporter](https://apps.apple.com/us/app/transporter/id1450874784) or Xcode
3. Upload to App Store Connect

### Step 7: App Store Review

1. Go to App Store Connect
2. Select your app → **TestFlight** or **App Store**
3. Add build and submit for review

---

## Android Setup & Deployment

### Step 1: Google Play Console Account

1. Create account at https://play.google.com/console ($25 one-time fee)
2. Create app in Google Play Console
3. Complete store listing information

### Step 2: Create Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. **IAM & Admin** → **Service Accounts**
3. Create new service account:
   - Name: `eas-submit-service`
   - Role: **Service Account User**
4. Create JSON key and download

### Step 3: Link Service Account to Play Console

1. Go to [Play Console](https://play.google.com/console)
2. **Setup** → **API access**
3. Link your service account
4. Grant permissions:
   - **Release apps to production**
   - **Release apps to testing tracks**

### Step 4: Configure Submit in `eas.json`

```json
{
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

**Track Options**:

- `internal`: Internal testing track
- `alpha`: Alpha testing track
- `beta`: Beta testing track
- `production`: Production release

### Step 5: Build Android App

```bash
eas build --platform android --profile production
```

This creates an **AAB** (Android App Bundle) file, which is required for Play Store.

### Step 6: Submit to Play Store

**Option A: Automatic (Recommended)**

```bash
# Submit latest build
eas submit --platform android --latest

# Submit specific build
eas submit --platform android --id <build-id>
```

**Option B: Manual**

1. Download `.aab` from EAS dashboard
2. Go to Play Console → **Production** → **Create release**
3. Upload AAB file
4. Complete release notes and submit

### Step 7: Play Store Review

- Review typically takes 1-3 days
- Monitor status in Play Console

---

## OTA Updates

OTA (Over-The-Air) updates allow pushing JavaScript/asset updates without app store review.

### Configuration

Add to `app.json`:

```json
{
  "expo": {
    "updates": {
      "url": "https://u.expo.dev/ccb417f7-83dc-4312-b994-dccc8990101e",
      "enabled": true,
      "checkAutomatically": "ON_LOAD",
      "fallbackToCacheTimeout": 0
    }
  }
}
```

### Publishing Updates

```bash
# Publish to production branch
eas update --branch production --message "Fix: Resolved booking issue"

# Publish to preview branch
eas update --branch preview --message "New feature: Earnings dashboard"

# Publish with specific runtime version
eas update --branch production --runtime-version "1.0.0"
```

### Update Channels

```bash
# Create a channel
eas channel:create production

# Set channel to point to a branch
eas channel:edit production --branch production
```

### Limitations

- **Cannot update**: Native code changes, new native modules, app version changes
- **Can update**: JavaScript code, assets, configuration (some)

---

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/mobile-build.yml`:

```yaml
name: Mobile Build and Deploy

on:
  push:
    branches: [main]
    paths:
      - "apps/pro_mobile/**"
      - "packages/**"
  workflow_dispatch:

jobs:
  build:
    name: Build and Submit
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "24"

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Build iOS
        run: |
          cd apps/pro_mobile
          eas build --platform ios --profile production --non-interactive

      - name: Build Android
        run: |
          cd apps/pro_mobile
          eas build --platform android --profile production --non-interactive

      - name: Submit iOS
        if: success()
        run: |
          cd apps/pro_mobile
          eas submit --platform ios --latest --non-interactive

      - name: Submit Android
        if: success()
        run: |
          cd apps/pro_mobile
          eas submit --platform android --latest --non-interactive
```

### Required GitHub Secrets

- `EXPO_TOKEN`: Get from https://expo.dev/accounts/[account]/settings/access-tokens

### EAS Update in CI/CD

```yaml
- name: Publish OTA Update
  run: |
    cd apps/pro_mobile
    eas update --branch production --message "Deployed from CI" --non-interactive
```

---

## Troubleshooting

### Common Issues

#### 1. Build Fails: "Missing credentials"

```bash
# Set up credentials interactively
eas credentials

# Or let EAS manage automatically
eas credentials --platform ios
```

#### 2. Build Fails: "Environment variable not found"

```bash
# Verify secrets are set
eas secret:list

# Set missing secret
eas secret:create --scope project --name VARIABLE_NAME --value value
```

#### 3. Submit Fails: "Invalid credentials"

```bash
# Reconfigure submit credentials
eas submit --platform ios
eas submit --platform android
```

#### 4. Monorepo Build Issues

Ensure you're running commands from `apps/pro_mobile`:

```bash
cd apps/pro_mobile
eas build --platform ios --profile production
```

#### 5. Sentry Plugin Errors

Verify Sentry secrets are set:

```bash
eas secret:list | grep SENTRY
```

#### 6. Build Timeout

- Check build logs in EAS dashboard
- Try building one platform at a time
- Use `--local` flag if you have native tooling

### Useful Commands

```bash
# View build status
eas build:list

# View specific build
eas build:view <build-id>

# Download build artifact
eas build:download <build-id>

# Cancel running build
eas build:cancel <build-id>

# View project info
eas project:info

# Check credentials
eas credentials

# View submit history
eas submit:list
```

### Getting Help

- **EAS Documentation**: https://docs.expo.dev/build/introduction/
- **Expo Discord**: https://chat.expo.dev
- **EAS Status**: https://status.expo.dev

---

## Best Practices

### 1. Version Management

- Use semantic versioning (`1.0.0`, `1.1.0`, etc.)
- Let EAS auto-increment build numbers
- Update `version` in `app.json` for major releases

### 2. Build Strategy

- **Development**: For local testing and debugging
- **Preview**: For QA and internal testing
- **Production**: For app store submission only

### 3. Secrets Management

- Never commit secrets to git
- Use EAS secrets for sensitive data
- Use environment variables in `eas.json` for non-sensitive config

### 4. Testing Before Submission

- Always test preview builds before production
- Use TestFlight (iOS) and Internal Testing (Android)
- Test on real devices, not just simulators

### 5. OTA Updates

- Test updates in preview branch first
- Use clear, descriptive update messages
- Monitor update adoption in EAS dashboard

### 6. Build Optimization

- Build one platform at a time if builds are slow
- Use `--local` flag only if you have native tooling
- Monitor build times and optimize dependencies

---

## Quick Reference

### Essential Commands

```bash
# Login
eas login

# Build
eas build --platform all --profile production

# Submit
eas submit --platform all --latest

# Update
eas update --branch production --message "Update message"

# Credentials
eas credentials

# Secrets
eas secret:list
eas secret:create --scope project --name NAME --value VALUE
```

### Project URLs

- **Dashboard**: https://expo.dev/accounts/[account]/projects/encuentraya-pros
- **Builds**: https://expo.dev/accounts/[account]/projects/encuentraya-pros/builds
- **Updates**: https://expo.dev/accounts/[account]/projects/encuentraya-pros/updates

---

## Next Steps

1. ✅ EAS project configured (`projectId` in `app.json`)
2. ✅ `eas.json` created with build profiles
3. ⏭️ Set up Apple Developer account (iOS)
4. ⏭️ Set up Google Play Console account (Android)
5. ⏭️ Configure credentials
6. ⏭️ Set EAS secrets
7. ⏭️ Run first production build
8. ⏭️ Submit to app stores

---

**Last Updated**: Based on EAS CLI v16.28.0 and Expo SDK 54
