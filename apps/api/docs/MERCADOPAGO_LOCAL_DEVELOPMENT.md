# Mercado Pago Local Development Guide

This guide explains how to develop and test Mercado Pago payment integration locally, including webhook handling.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Setting Up ngrok](#setting-up-ngrok)
4. [Configuration Options](#configuration-options)
5. [Testing Workflows](#testing-workflows)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

## Overview

Mercado Pago webhooks require a publicly accessible URL. Since `localhost` URLs are not accessible from the internet, you need to use a tunneling service like **ngrok** to expose your local API server to Mercado Pago's servers.

### The Challenge

- Mercado Pago sends webhooks via HTTP POST to your server
- Your local API runs on `http://localhost:3002`
- Mercado Pago's servers cannot reach `localhost` URLs
- **Solution**: Use ngrok to create a public HTTPS URL that tunnels to your localhost

## Prerequisites

- Node.js >= 18
- pnpm 10.0.0
- Mercado Pago test account credentials
- ngrok account (free tier is sufficient)

## Setting Up ngrok

### Step 1: Install ngrok

**macOS:**

```bash
brew install ngrok
```

**Linux:**

```bash
# Download from https://ngrok.com/download
# Or use package manager
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | \
  sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null && \
  echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | \
  sudo tee /etc/apt/sources.list.d/ngrok.list && \
  sudo apt update && sudo apt install ngrok
```

**Windows:**

- Download from https://ngrok.com/download
- Extract and add to PATH

### Step 2: Create ngrok Account

1. Go to https://ngrok.com/
2. Sign up for a free account
3. Get your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken

### Step 3: Configure ngrok

```bash
# Set your authtoken (one-time setup)
ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
```

This saves your configuration to `~/.ngrok2/ngrok.yml`.

### Step 4: Verify Installation

```bash
ngrok version
# Should show version number
```

## Configuration Options

### Option 1: Using ngrok (Recommended for Automatic Webhooks)

This option allows Mercado Pago to automatically send webhooks to your local server.

#### Setup Steps

1. **Start your API server:**

   ```bash
   cd apps/api
   pnpm dev
   ```

   API runs on `http://localhost:3002`

2. **Start ngrok in a separate terminal:**

   ```bash
   ngrok http 3002
   ```

3. **Copy the HTTPS forwarding URL:**

   ```
   Forwarding   https://abc123-def456.ngrok-free.app -> http://localhost:3002
   ```

   Your public URL is: `https://abc123-def456.ngrok-free.app`

4. **Update environment variables:**

   Edit `apps/api/.env.local`:

   ```bash
   MERCADOPAGO_WEBHOOK_URL=https://abc123-def456.ngrok-free.app
   ```

5. **Restart your API server:**

   ```bash
   # Stop API (Ctrl+C)
   pnpm dev
   ```

6. **Verify the tunnel:**
   - Open ngrok web interface: http://127.0.0.1:4040
   - Test your API: `https://abc123-def456.ngrok-free.app/api/trpc/health.ping`
   - Should return the same response as `http://localhost:3002/api/trpc/health.ping`

#### How It Works

- When creating a payment preference, your code sets:
  ```
  notification_url: "https://abc123-def456.ngrok-free.app/api/webhooks/mercadopago"
  ```
- Mercado Pago sends webhooks to this public URL
- ngrok forwards the request to your local `localhost:3002`
- Your API processes the webhook normally

#### Monitoring Webhooks

**ngrok Inspector:**

- Open http://127.0.0.1:4040 in your browser
- See all incoming requests in real-time
- View request headers, body, and response
- Replay requests for testing

**API Logs:**

- Watch Terminal 1 (API server) for webhook processing logs
- You'll see: "Processing webhook event", "Webhook processed successfully"

---

### Option 2: Manual Testing (Without ngrok)

This option is useful when you don't need automatic webhooks and prefer manual testing.

#### Setup Steps

1. **Start your API server:**

   ```bash
   cd apps/api
   pnpm dev
   ```

2. **Don't set `MERCADOPAGO_WEBHOOK_URL`** in `.env.local`

3. **Create payment preferences:**
   - Preferences are created without `notification_url`
   - Mercado Pago will use dashboard-configured URL (if any)

4. **Manually simulate webhooks:**
   - Use Mercado Pago MCP server `simulate_webhook` tool (see below)
   - Or use Mercado Pago dashboard → Webhooks → Simulate

#### Using Mercado Pago MCP to simulate a webhook

The Mercado Pago MCP server (configured in `.cursor/mcp.json` as `mercadopago-mcp-server`) exposes a **`simulate_webhook`** tool. It sends a real HTTP POST from Mercado Pago's servers to the URL you provide, so **`url_callback` must be a publicly reachable URL** (e.g. your ngrok HTTPS URL). `http://localhost:3002` will not work because Mercado Pago cannot reach your machine.

**Prerequisites:**

- ngrok running and forwarding to port 3002
- API server running (`pnpm dev` in `apps/api`)
- A **payment ID** from a test payment (create a test preference, pay with test credentials, or use a known test payment ID)

**`simulate_webhook` parameters:**

| Parameter                 | Required | Description                                                                                                                              |
| ------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `resource_id`             | Yes      | ID of the resource to simulate (e.g. a payment ID).                                                                                      |
| `topic`                   | No       | Topic of the notification. Default: `"payment"`.                                                                                         |
| `url_callback`            | No       | URL that will receive the simulated POST. If omitted, MP uses the URL configured in the dashboard. For local dev, set to your ngrok URL. |
| `callback_env_production` | No       | `true` = production environment, `false` = sandbox. Default: `false`.                                                                    |

**Example: simulate a payment webhook to your local API via ngrok**

1. Start ngrok: `ngrok http 3002`
2. Copy your HTTPS URL (e.g. `https://abc123-def456.ngrok-free.app`)
3. In **Cursor Chat** (or any client where the Mercado Pago MCP is connected), ask the assistant to run the tool, for example:

   > Use the Mercado Pago MCP **simulate_webhook** tool to send a payment webhook to my local API. Parameters: topic `payment`, resource_id `123456789` (replace with your test payment ID), url_callback `https://YOUR-NGROK-URL.ngrok-free.app/api/webhooks/mercadopago`, callback_env_production `false`.

4. Replace `YOUR-NGROK-URL` and `123456789` with your ngrok host and a real payment ID.
5. Check ngrok inspector (http://127.0.0.1:4040) and your API logs for the incoming webhook.

**Note:** If you omit `url_callback`, the simulation is sent to the webhook URL configured in [Your integrations](https://www.mercadopago.com.ar/developers/panel/app) → Webhooks. For local testing you must pass your ngrok URL.

---

### Option 3: Dashboard Configuration

You can configure a default webhook URL in the Mercado Pago dashboard:

1. Go to https://www.mercadopago.com.ar/developers/panel/app
2. Select your application
3. Navigate to **Webhooks → Configure Notifications**
4. Set **Production URL** or **Test URL** to your ngrok URL
5. Save configuration

**Note:** Preference-level `notification_url` (set in code) takes precedence over dashboard configuration.

## Testing Workflows

### Workflow 1: Complete Payment Flow with ngrok

**Terminal 1 - API Server:**

```bash
cd apps/api
pnpm dev
# API running on http://localhost:3002
```

**Terminal 2 - ngrok:**

```bash
ngrok http 3002
# Copy the HTTPS URL: https://abc123.ngrok.io
```

**Terminal 3 - Update Environment:**

```bash
# Edit apps/api/.env.local
echo 'MERCADOPAGO_WEBHOOK_URL=https://abc123.ngrok.io' >> apps/api/.env.local

# Restart API (go back to Terminal 1, Ctrl+C, then pnpm dev)
```

**Browser - ngrok Inspector:**

- Open http://127.0.0.1:4040
- Keep this open to monitor webhook requests

**Test Steps:**

1. Create a test payment preference via your app
2. Complete payment in Mercado Pago (use test credentials)
3. Watch ngrok inspector - webhook POST request should appear
4. Check API logs - should show webhook processing
5. Verify payment status updated in your database

### Workflow 2: Manual Webhook Testing (MCP + ngrok)

Mercado Pago's `simulate_webhook` tool sends the request from their servers, so your endpoint must be reachable from the internet. Use ngrok and pass the ngrok URL as `url_callback`.

**Terminal 1 - API Server:**

```bash
cd apps/api
pnpm dev
```

**Terminal 2 - ngrok:**

```bash
ngrok http 3002
# Copy the HTTPS URL, e.g. https://abc123.ngrok-free.app
```

**Test Steps:**

1. Create a test payment and note the **payment ID** (or use an existing test payment ID).
2. In Cursor, use the Mercado Pago MCP **simulate_webhook** tool with:
   - `topic`: `"payment"`
   - `resource_id`: your payment ID
   - `url_callback`: `"https://YOUR-NGROK-URL/api/webhooks/mercadopago"` (replace with your ngrok HTTPS URL)
   - `callback_env_production`: `false`
3. Check ngrok inspector (http://127.0.0.1:4040) and API logs for the webhook POST.
4. Verify payment status updated in your app.

### Workflow 3: Testing with Test Users

Mercado Pago provides test users for testing payment flows:

**Create Test User (via MCP):**

```bash
# Use create_test_user tool
# Parameters:
# - site_id: "MLA" (Argentina), "MLB" (Brazil), etc.
# - description: "Test seller"
# - profile: "seller"
# - amount: 5000 (test money)
```

**Add Money to Test User:**

```bash
# Use add_money_test_user tool
# Parameters:
# - test_user_id: {user_id}
# - amount: 10000
```

## Environment Variables

### Required for Local Development

```bash
# apps/api/.env.local

# Mercado Pago Access Token (use TEST-... token for development)
MERCADOPAGO_ACCESS_TOKEN="TEST-your-test-access-token"

# Optional: Webhook Secret (get from Mercado Pago dashboard)
MERCADOPAGO_WEBHOOK_SECRET="your-webhook-secret"

# Optional: Webhook URL (set to ngrok URL when using ngrok)
MERCADOPAGO_WEBHOOK_URL="https://abc123.ngrok.io"

# Client App URL (for payment return redirects)
CLIENT_URL="http://localhost:3000"
```

### Environment Variable Behavior

| Variable                     | Development                     | Production                    |
| ---------------------------- | ------------------------------- | ----------------------------- |
| `MERCADOPAGO_WEBHOOK_URL`    | Optional (use ngrok URL if set) | Required (production API URL) |
| `MERCADOPAGO_ACCESS_TOKEN`   | Use `TEST-...` token            | Use production token          |
| `MERCADOPAGO_WEBHOOK_SECRET` | Optional (recommended)          | Required                      |

## Troubleshooting

### Problem: "ngrok: command not found"

**Solution:**

```bash
# macOS
brew install ngrok

# Verify installation
ngrok version
```

### Problem: "ERR_NGROK_108" - Authtoken Required

**Solution:**

```bash
# Get authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken
ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
```

### Problem: Webhooks Not Arriving

**Checklist:**

1. ✅ Is ngrok running? (Check Terminal 2)
2. ✅ Is API server running? (Check Terminal 1, port 3002)
3. ✅ Does `MERCADOPAGO_WEBHOOK_URL` match ngrok URL?
4. ✅ Did you restart API after setting env var?
5. ✅ Check ngrok inspector (http://127.0.0.1:4040) for incoming requests
6. ✅ Verify webhook URL in Mercado Pago dashboard matches ngrok URL

**Debug Steps:**

```bash
# Test ngrok tunnel directly
curl https://your-ngrok-url.ngrok.io/api/trpc/health.ping

# Check API logs for webhook endpoint
# Should see: POST /api/webhooks/mercadopago

# Check ngrok inspector for requests
# Open: http://127.0.0.1:4040
```

### Problem: "Tunnel session expired"

**Solution:**

- Free ngrok sessions expire after 2 hours of inactivity
- Restart ngrok: `ngrok http 3002`
- **Important**: You'll get a NEW URL - update `MERCADOPAGO_WEBHOOK_URL` and restart API

### Problem: "Too many connections" (Free Plan)

**Solution:**

- Free plan has connection limits
- Wait a minute and try again
- Consider upgrading to paid plan for unlimited connections

### Problem: ngrok URL Changes Every Time

**Free Plan Behavior:**

- Each time you restart ngrok, you get a new random URL
- Example: `https://abc123.ngrok.io` → `https://xyz789.ngrok.io`

**Solutions:**

1. **Keep ngrok running** - Don't restart unless necessary
2. **Use paid plan** - Get static domain that never changes
3. **Update env var** - When URL changes, update `.env.local` and restart API

### Problem: Webhook Signature Verification Failing

**Check:**

1. Is `MERCADOPAGO_WEBHOOK_SECRET` set correctly?
2. Does it match the secret in Mercado Pago dashboard?
3. Check API logs for "Invalid webhook signature" errors

**Solution:**

```bash
# Get webhook secret from Mercado Pago dashboard:
# Your integrations → Webhooks → Configure Notifications → Show Secret

# Add to .env.local:
MERCADOPAGO_WEBHOOK_SECRET="your-secret-here"
```

### Problem: Payment Preferences Created But No Webhooks

**Possible Causes:**

1. `notification_url` not set in preference (check code)
2. Mercado Pago dashboard webhook URL not configured
3. ngrok tunnel not active
4. Wrong webhook URL format

**Solution:**

```bash
# Check if notification_url is being set
# Look at preference creation logs

# Verify ngrok is forwarding correctly
curl https://your-ngrok-url.ngrok.io/api/webhooks/mercadopago
# Should return 405 Method Not Allowed (expected for GET)
# Or check ngrok inspector for POST requests
```

## Best Practices

### 1. Use Test Credentials

**Always use TEST credentials in development:**

- Access tokens start with `TEST-...`
- No real money involved
- Safe to test payment flows

**Get test credentials:**

- Mercado Pago dashboard → Credentials
- Copy "Test" access token (starts with `TEST-`)

### 2. Keep ngrok Running

- Don't close the ngrok terminal during development
- If you need to restart, remember to update the URL
- Consider using a terminal multiplexer (tmux/screen) to keep sessions alive

### 3. Monitor Webhook Requests

**Always keep ngrok inspector open:**

- http://127.0.0.1:4040
- See requests in real-time
- Debug issues quickly
- Replay requests for testing

### 4. Use Environment-Specific Configuration

**Development:**

```bash
MERCADOPAGO_ACCESS_TOKEN="TEST-..."
MERCADOPAGO_WEBHOOK_URL="https://abc123.ngrok.io"  # Optional
```

**Production:**

```bash
MERCADOPAGO_ACCESS_TOKEN="APP_USR-..."  # Production token
MERCADOPAGO_WEBHOOK_URL="https://api.encuentraya.com"  # Required
MERCADOPAGO_WEBHOOK_SECRET="..."  # Required
```

### 5. Test Webhook Signature Verification

**In development:**

- Webhook secret is optional (verification skipped with warning)
- Still recommended to test with secret

**In production:**

- Webhook secret is **required**
- Always verify signatures
- Prevents unauthorized webhook requests

### 6. Handle ngrok URL Changes

**When ngrok URL changes:**

1. Copy new URL from ngrok output
2. Update `.env.local`: `MERCADOPAGO_WEBHOOK_URL=https://new-url.ngrok.io`
3. Restart API server
4. Update Mercado Pago dashboard (if using dashboard config)

**Or use paid ngrok plan:**

- Static domain that never changes
- More reliable for development

### 7. Test Different Payment Scenarios

**Test cases to cover:**

- ✅ Payment approved
- ✅ Payment pending
- ✅ Payment rejected
- ✅ Payment cancelled
- ✅ Payment refunded
- ✅ Webhook retries (simulate failures)

### 8. Use Mercado Pago MCP Tools

**Available tools:**

- `simulate_webhook` - Test webhook delivery
- `quality_checklist` - Verify integration quality
- `quality_evaluation` - Evaluate integration with payment ID
- `create_test_user` - Create test users with money
- `add_money_test_user` - Add money to test users

## Quick Reference

### Starting Development Session

```bash
# Terminal 1: Start API
cd apps/api
pnpm dev

# Terminal 2: Start ngrok
ngrok http 3002

# Terminal 3: Update env (one-time per ngrok session)
# Copy HTTPS URL from ngrok output
echo 'MERCADOPAGO_WEBHOOK_URL=https://abc123.ngrok.io' >> apps/api/.env.local

# Restart API (Terminal 1: Ctrl+C, then pnpm dev)

# Browser: Open ngrok inspector
open http://127.0.0.1:4040
```

### Testing Webhook Endpoint

```bash
# Test ngrok tunnel
curl https://your-ngrok-url.ngrok.io/api/trpc/health.ping

# Test webhook endpoint (should return 405 for GET)
curl https://your-ngrok-url.ngrok.io/api/webhooks/mercadopago
```

### Common ngrok Commands

```bash
# Start tunnel
ngrok http 3002

# Start with custom subdomain (paid plan)
ngrok http 3002 --subdomain=my-custom-name

# Start with custom region
ngrok http 3002 --region=eu

# View config
ngrok config check

# List tunnels
ngrok api tunnels list
```

## Additional Resources

- **ngrok Documentation**: https://ngrok.com/docs
- **Mercado Pago Webhook Docs**: https://www.mercadopago.com.ar/developers/en/docs/checkout-pro/payment-notifications
- **Mercado Pago Test Credentials**: https://www.mercadopago.com.ar/developers/en/docs/checkout-pro/test-credentials
- **Mercado Pago MCP Server**: Use `simulate_webhook` tool for manual testing

## Summary

**For automatic webhook testing:**

1. Install and configure ngrok
2. Start ngrok tunnel: `ngrok http 3002`
3. Set `MERCADOPAGO_WEBHOOK_URL` to ngrok URL
4. Restart API server
5. Monitor webhooks via ngrok inspector

**For manual testing (MCP simulate_webhook):**

1. Start ngrok and your API (simulate_webhook sends from MP servers, so you need a public URL).
2. Use Mercado Pago MCP `simulate_webhook` with `url_callback` set to `https://YOUR-NGROK-URL/api/webhooks/mercadopago` and `resource_id` set to a test payment ID.
3. Check ngrok inspector and API logs for the webhook.

**Remember:**

- Keep ngrok running during development
- Update URL when ngrok restarts
- Use TEST credentials in development
- Monitor webhooks via ngrok inspector
