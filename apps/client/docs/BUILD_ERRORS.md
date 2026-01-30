# Why Next.js Build Errors Aren't Caught by Type-Check

## Problem

Build errors in the Next.js client app sometimes occur even when `pnpm lint` and `pnpm check-types` pass successfully. This document explains why and how to catch these errors earlier.

## Root Causes

### 1. **Missing `check-types` Script** ✅ Fixed

The client app was missing the `check-types` script, so CI's type-check step wasn't actually running TypeScript validation for this app.

### 2. **Next.js Build-Time Validations**

Next.js performs additional checks during `next build` that TypeScript (`tsc --noEmit`) doesn't catch:

#### **Route Structure Validation**

- Missing `layout.tsx` files in route groups
- Invalid route segment configurations
- Conflicting route definitions
- Missing required route files (e.g., `page.tsx`)

#### **Server/Client Component Boundaries**

- Using server-only APIs in client components
- Importing server components in client components incorrectly
- Missing `"use client"` or `"use server"` directives
- Using Node.js APIs in client components

#### **Metadata & Configuration**

- Invalid metadata exports
- Missing or invalid `generateMetadata` return types
- Invalid `next.config.ts` configuration
- Sentry configuration errors (if Sentry is enabled)

#### **Dynamic Imports & Code Splitting**

- Failed dynamic imports (`import()`)
- Missing modules that are only required at build time
- Webpack/bundler errors during code splitting

#### **Environment Variables**

- Missing required environment variables (validated at build time via `instrumentation.ts`)
- Invalid environment variable formats
- Environment-specific code that fails in production builds

#### **Image & Asset Optimization**

- Missing image files referenced in code
- Invalid image formats
- Image optimization errors

#### **Webpack/Bundler Errors**

- Circular dependencies
- Module resolution failures
- Missing peer dependencies
- Incompatible module formats

### 3. **TypeScript Configuration Differences**

The build process may use different TypeScript settings or stricter checks:

- Next.js uses its own TypeScript plugin (`"plugins": [{ "name": "next" }]`)
- Build-time type checking may be stricter
- Some errors only appear when Next.js analyzes the full dependency graph

### 4. **Runtime vs Compile-Time**

Some errors only appear when Next.js:

- Actually bundles the code
- Performs tree-shaking
- Generates static pages
- Analyzes route metadata

## Solutions

### 1. **Add `check-types` Script** ✅ Done

```json
{
  "scripts": {
    "check-types": "tsc --noEmit"
  }
}
```

### 2. **Add Build Check to CI** (Recommended)

Add a build validation step to CI that runs `next build` in a dry-run mode or validates the build without deploying:

```yaml
# In .github/workflows/ci.yml
build-check:
  name: Build Check
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: "24"
    - uses: pnpm/action-setup@v2
      with:
        version: 9
    - run: pnpm install --frozen-lockfile
    - name: Build client app
      run: |
        cd apps/client
        pnpm build
      env:
        # Add required env vars for build
        NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}
        # ... other required vars
```

### 3. **Use Next.js Type Checking**

Next.js has built-in type checking during build. Ensure `tsconfig.json` has:

```json
{
  "compilerOptions": {
    "strict": true,
    "noEmit": true
  }
}
```

### 4. **Pre-commit Hook**

Add a pre-commit hook that runs build:

```json
{
  "simple-git-hooks": {
    "pre-commit": "pnpm lint-staged && pnpm turbo run build --filter=client --dry-run"
  }
}
```

### 5. **Local Development**

Run build locally before pushing:

```bash
cd apps/client
pnpm build
```

## Common Build Errors to Watch For

1. **Missing environment variables** - Check `instrumentation.ts` and `next.config.ts`
2. **Server/client component violations** - Look for `"use client"`/`"use server"` issues
3. **Route structure errors** - Verify all routes have required files
4. **Dynamic import failures** - Check `import()` statements
5. **Sentry configuration** - If Sentry is enabled, ensure all required env vars are set
6. **Metadata errors** - Check `generateMetadata` functions return valid types

## Best Practices

1. **Always run `pnpm build` locally** before pushing
2. **Add build check to CI** to catch errors early
3. **Use TypeScript strictly** - Enable `strict: true` in `tsconfig.json`
4. **Test production builds** - Run `pnpm build:prod` locally
5. **Monitor build logs** - Check for warnings that might become errors

## Related Files

- `apps/client/package.json` - Scripts configuration
- `apps/client/tsconfig.json` - TypeScript configuration
- `apps/client/next.config.ts` - Next.js configuration
- `apps/client/instrumentation.ts` - Build-time initialization
- `.github/workflows/ci.yml` - CI configuration
