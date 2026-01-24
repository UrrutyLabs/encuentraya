# Railway Deployment Guide

This document explains how to deploy the API to Railway.

## Configuration

Railway configuration is in `railway.json`. The build process:

1. **Build Phase:**
   - Installs dependencies from monorepo root
   - Generates Prisma Client
   - Builds Next.js application

2. **Deploy Phase:**
   - Runs database migrations
   - Starts the Next.js server

## Setup Steps

### 1. Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository

### 2. Configure Service

Railway will auto-detect the monorepo. Configure:

- **Root Directory:** Leave empty (Railway will detect `apps/api`)
- **Build Command:** (Auto-detected from `railway.json`)
- **Start Command:** (Auto-detected from `railway.json`)

### 3. Add PostgreSQL Database

1. In Railway project, click "New"
2. Select "Database" → "Add PostgreSQL"
3. Railway will automatically create `DATABASE_URL` environment variable

### 4. Configure Environment Variables

Add these environment variables in Railway dashboard:

#### Required Variables

```bash
# Database (auto-created if you add Railway PostgreSQL)
DATABASE_URL=postgresql://postgres:password@host:5432/railway

# Supabase Auth (keep your existing Supabase project)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Node Environment
NODE_ENV=production
PORT=3000  # Railway sets this automatically, but you can override

# Optional: Upstash Redis (for rate limiting)
UPSTASH_REDIS_REST_URL=your-upstash-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-token

# Optional: SendGrid (for emails)
SENDGRID_API_KEY=your-sendgrid-key
ADMIN_EMAIL=admin@example.com
SUPPORT_EMAIL=support@example.com

# Optional: Twilio (for WhatsApp)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_WHATSAPP_FROM=your-twilio-number

# Optional: MercadoPago (for payments)
MERCADOPAGO_ACCESS_TOKEN=your-mp-token
MERCADOPAGO_WEBHOOK_SECRET=your-mp-secret
```

### 5. Configure GitHub Status Checks (Wait for CI)

To make Railway wait for GitHub CI checks (tests, linters) before deploying:

1. **In Railway Dashboard:**
   - Go to your project → Settings → GitHub
   - Enable "Wait for GitHub Checks"
   - Add required check names:
     - `CI / lint`
     - `CI / type-check`
     - `CI / test`

2. **Alternative: Use Branch Protection Rules:**
   - In GitHub repo → Settings → Branches
   - Add branch protection rule for `main`
   - Require status checks: `CI / lint`, `CI / type-check`, `CI / test`
   - Railway will automatically wait for these checks

3. **How it works:**
   - When you push to `main`, GitHub Actions runs CI checks
   - Railway detects the push but waits for status checks to pass
   - Once all checks pass, Railway automatically deploys
   - If any check fails, Railway won't deploy

### 6. Deploy

Railway will automatically:

- Wait for GitHub CI checks to pass (if configured)
- Build your application
- Run migrations
- Start the server
- Provide a public URL

## Monorepo Configuration

Railway handles monorepos by:

- Detecting `pnpm-workspace.yaml` at root
- Installing dependencies from root
- Building the `apps/api` directory
- Using workspace dependencies correctly

## Database Migrations

Migrations run automatically on each deploy via the `startCommand`:

```bash
pnpm db:migrate deploy --config=./prisma/config.ts
```

This ensures your database schema is always up-to-date.

## Custom Domain

1. In Railway dashboard → Settings → Networking
2. Click "Generate Domain" or "Add Custom Domain"
3. Update your DNS records if using custom domain

## Monitoring

Railway provides:

- **Logs:** View in Railway dashboard
- **Metrics:** CPU, Memory, Network usage
- **Deployments:** History and rollback options

## Troubleshooting

### Build Fails

- Check logs in Railway dashboard
- Verify `pnpm-workspace.yaml` exists at root
- Ensure all workspace dependencies are listed

### Database Connection Fails

- Verify `DATABASE_URL` is set correctly
- Check PostgreSQL service is running
- Ensure connection string format is correct

### Migrations Fail

- Check database permissions
- Verify `DATABASE_URL` is accessible
- Review migration files for errors

## GitHub CI Integration

### CI Workflow

The repository includes a `.github/workflows/ci.yml` workflow that runs:

- **Lint:** Checks code style and formatting
- **Type Check:** Validates TypeScript types
- **Test:** Runs unit tests

### Railway Status Checks

Railway can wait for GitHub status checks before deploying. Configure this in Railway dashboard:

1. **Settings → GitHub → Required Checks**
2. Add check names:
   - `CI / lint`
   - `CI / type-check`
   - `CI / test`

### How It Works

```
Push to main
    ↓
GitHub Actions runs CI checks
    ↓
Railway waits for checks to pass
    ↓
✅ All checks pass → Railway deploys
❌ Any check fails → Railway skips deployment
```

### Manual Override

If you need to deploy without waiting for CI:

- Use Railway dashboard → Deploy → "Deploy Now"
- Or use Railway CLI: `railway up --detach`

## Cost

- **Hobby Plan:** $5/month + usage
- **Pro Plan:** $20/month + usage
- **PostgreSQL:** Included in usage (~$5-10/month for small DB)

Total: ~$10-30/month depending on usage
