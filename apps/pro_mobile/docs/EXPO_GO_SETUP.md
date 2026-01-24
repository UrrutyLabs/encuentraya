# Using Expo Go for Local Development

This guide explains how to use **Expo Go** to test your app on real devices without needing paid developer accounts or building native apps.

## What is Expo Go?

**Expo Go** is a free app (available on iOS App Store and Google Play Store) that lets you run Expo apps on your phone without building them. It's perfect for:

- Quick testing during development
- Testing on real devices
- Sharing with team members for testing
- No need for Apple Developer or Google Play accounts

## Limitations

⚠️ **Important**: Expo Go only supports Expo SDK modules. Custom native modules (like `@sentry/react-native`) are **not supported**.

**What works in Expo Go:**

- ✅ All Expo SDK modules (`expo-router`, `expo-notifications`, etc.)
- ✅ JavaScript/TypeScript code
- ✅ React Native components
- ✅ Your API calls and business logic

**What doesn't work:**

- ❌ Custom native modules (like `@sentry/react-native`)
- ❌ Custom native code
- ❌ Some third-party libraries with native dependencies

## Setup

### Step 1: Install Expo Go

**iOS:**

- Download from [App Store](https://apps.apple.com/app/expo-go/id982107779)

**Android:**

- Download from [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Step 2: Start Your Development Server

```bash
cd apps/pro_mobile
pnpm start
# or
expo start
```

This will:

1. Start the Metro bundler
2. Show a QR code in your terminal
3. Display options to open in Expo Go

### Step 3: Connect Your Device

**Option A: Same Network (Recommended)**

1. Make sure your phone and computer are on the same Wi-Fi network
2. Open Expo Go app on your phone
3. Scan the QR code from the terminal
4. App will load automatically

**Option B: Tunnel (Slower, but works across networks)**

```bash
expo start --tunnel
```

Then scan the QR code with Expo Go.

**Option C: Manual Connection**

1. In Expo Go, tap "Enter URL manually"
2. Enter the URL shown in terminal (e.g., `exp://192.168.1.100:8081`)

## Sentry Auto-Disable

✅ **Good News**: Sentry is automatically disabled when running in Expo Go!

The app detects when it's running in Expo Go and:

- Skips Sentry initialization
- Logs a message: "Running in Expo Go - Sentry disabled"
- All other functionality works normally
- Logger still works (just without Sentry reporting)

You don't need to do anything - it happens automatically! 🎉

## Development Workflow

### Starting Development

```bash
cd apps/pro_mobile
pnpm start
```

### Making Changes

1. Edit your code
2. Save the file
3. App automatically reloads in Expo Go (Fast Refresh)
4. See changes instantly!

### Debugging

**View Logs:**

- Open Expo Go app
- Shake your device (or press `Cmd+D` on iOS simulator, `Cmd+M` on Android)
- Tap "Debug Remote JS"
- Open Chrome DevTools at `http://localhost:19000/debugger-ui`

**React Native Debugger:**

- Shake device → "Debug Remote JS"
- Install [React Native Debugger](https://github.com/jhen0409/react-native-debugger)

## Troubleshooting

### "Unable to resolve module @sentry/react-native"

**Solution**: This is expected! Sentry is automatically disabled in Expo Go. The app will still work, just without crash reporting.

### "Network request failed"

**Possible causes:**

1. **Different networks**: Phone and computer not on same Wi-Fi
   - **Fix**: Use `expo start --tunnel` or connect to same network

2. **Firewall blocking**: Computer firewall blocking Metro bundler
   - **Fix**: Allow Node.js/Metro through firewall

3. **API URL**: Your API might be using `localhost`
   - **Fix**: Use your computer's local IP address (e.g., `192.168.1.100:3002`)

### App won't load

1. **Clear Expo Go cache:**
   - Shake device → "Reload"
   - Or close and reopen Expo Go

2. **Restart Metro bundler:**

   ```bash
   # Stop current server (Ctrl+C)
   # Clear cache and restart
   expo start --clear
   ```

3. **Check Metro bundler logs:**
   - Look for errors in terminal
   - Check if port 8081 is available

### "Unable to connect to Metro"

1. **Check network:**

   ```bash
   # Make sure you can ping your computer from phone
   # Or use tunnel mode
   expo start --tunnel
   ```

2. **Check firewall:**
   - Allow Node.js through firewall
   - Port 8081 should be accessible

## Environment Variables

Make sure your `.env` file has:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_API_URL=http://your-computer-ip:3002
# EXPO_PUBLIC_SENTRY_DSN is optional - Sentry is disabled in Expo Go anyway
```

**Important**: Use your computer's local IP address (not `localhost`) for `EXPO_PUBLIC_API_URL` when testing on a real device.

Find your IP:

- **Mac/Linux**: `ifconfig | grep "inet "`
- **Windows**: `ipconfig`

## When to Use Expo Go vs Development Build

### Use Expo Go When:

- ✅ Quick testing during development
- ✅ Testing UI changes
- ✅ Sharing with team for quick demos
- ✅ You don't need custom native modules
- ✅ You want instant feedback

### Use Development Build When:

- ✅ You need Sentry crash reporting
- ✅ You need custom native modules
- ✅ You want production-like testing
- ✅ You're testing native features

## Quick Reference

```bash
# Start Expo Go development server
cd apps/pro_mobile
pnpm start

# Start with tunnel (works across networks)
expo start --tunnel

# Clear cache and start
expo start --clear

# Start and open in Expo Go automatically (if device connected)
expo start --go
```

## Next Steps

Once you're ready for production testing with Sentry and all native features:

1. **Build a development build:**

   ```bash
   eas build --platform android --profile development
   # or
   expo run:android --device
   ```

2. **Or build a preview build:**
   ```bash
   eas build --platform all --profile preview
   ```

See [EAS_BUILD_AND_DEPLOYMENT.md](./EAS_BUILD_AND_DEPLOYMENT.md) for more details.

---

**Happy coding! 🚀**
