# Production Setup Guide

Complete guide for deploying Monthly Shift Viewer to Cloudflare.

## Prerequisites

- Cloudflare account with Workers and Pages enabled
- Wrangler CLI installed: `npm install -g wrangler`
- Wrangler authenticated: `wrangler login`
- MetricAid API token
- Access password for the application gate

## Step 1: Create R2 Buckets

R2 buckets store runtime configuration files and telemetry data.

```bash
# Config buckets (for shift display/styling configs)
wrangler r2 bucket create schedule-viewer-config
wrangler r2 bucket create schedule-viewer-config-preview

# Telemetry buckets (for event storage)
wrangler r2 bucket create schedule-viewer-telemetry
wrangler r2 bucket create schedule-viewer-telemetry-preview
```

## Step 2: Upload Configuration to R2

Prepare and upload config files to R2:

```bash
# Edit configs locally if needed
# - src/config/shift-display.config.json
# - src/config/shift-styling.config.json

# Upload to production bucket
./scripts/upload-config-to-r2.sh

# Or upload to preview for testing
./scripts/upload-config-to-r2.sh --preview
```

## Step 3: Deploy Cloudflare Worker

Deploy the Rust backend that proxies MetricAid API:

```bash
cd worker
wrangler deploy
```

Note the deployed Worker URL (e.g., `https://schedule-viewer-worker.your-account.workers.dev`).

## Step 4: Set Worker Secrets

Add sensitive credentials to the Worker:

```bash
# Still in worker/ directory
wrangler secret put API_TOKEN
# Enter your MetricAid API token when prompted

wrangler secret put ACCESS_PASSWORD
# Enter a strong password for the application gate
```

## Step 5: Test Worker Endpoint

Verify the Worker is responding:

```bash
# Test shifts endpoint (should require authentication)
curl https://your-worker-url.workers.dev/api/shifts?ym=2025-12

# Test config endpoints (public)
curl https://your-worker-url.workers.dev/api/config/shift-display
curl https://your-worker-url.workers.dev/api/config/shift-styling
```

## Step 6: Configure Frontend Environment

**IMPORTANT**: The production setup uses a same-origin architecture to prevent script blockers from blocking telemetry. The frontend uses `/api` (relative path) and Pages Functions proxy requests to the Worker.

Environment variables are already configured in `.env.production`:

```bash
NEXT_PUBLIC_API_URL=/api  # Relative path - proxied via Pages Functions
NEXT_PUBLIC_DEFAULT_UNIT_NAME="Emergency Department"
NEXT_PUBLIC_SHIFT_CODE_DICT='{"D":{"label":"Day"},"N":{"label":"Night"},"O":{"label":"Off"}}'
```

These will be automatically picked up during the build.

## Step 7: Deploy Frontend to Cloudflare Pages

### Option A: GitHub Integration (Recommended)

1. Push code to GitHub repository
2. In Cloudflare dashboard, go to Workers & Pages > Create application > Pages > Connect to Git
3. Select your repository
4. Configure build settings:
   - Build command: `npm run build`
   - Build output directory: `out`
   - Environment variables: Add all `NEXT_PUBLIC_*` variables from .env.production
5. Click "Save and Deploy"

### Option B: Manual Deploy

```bash
# Build the static export
npm run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy out --project-name schedule-viewer
```

For manual deploys, set environment variables in Cloudflare dashboard:
Settings > Environment variables

## Step 8: Configure Service Binding (CRITICAL)

**This step is essential for same-origin deployment and preventing telemetry blocking.**

The Pages Function needs to be bound to the Worker to proxy `/api/*` requests:

1. In Cloudflare dashboard, go to your Pages project
2. Navigate to **Settings** > **Functions**
3. Scroll to **Service bindings**
4. Click **Add binding**:
   - Variable name: `WORKER`
   - Service: `schedule-viewer-worker` (your Worker name from Step 3)
   - Environment: `production`
5. Click **Save**

**Why this matters**: This makes all API requests same-origin (from the Pages domain), preventing script blockers from flagging telemetry as cross-site tracking.

## Step 9: Verify Deployment

1. Visit your Pages URL (e.g., `https://schedule-viewer.pages.dev`)
2. Test authentication gate:
   - Enter the password you set in Step 4
   - Should redirect to the schedule grid
3. Verify schedule loads:
   - Grid should display with current month data
   - Check browser console for errors
4. Test PDF export:
   - Navigate to `/pdf` route
   - Generate and download a PDF

## Step 10: Configure Custom Domain (Optional)

In Cloudflare Pages dashboard:
1. Go to your project > Custom domains
2. Add your domain (e.g., `schedule.yourdomain.com`)
3. Cloudflare will configure DNS automatically if domain is in your account

## Configuration Updates (Post-Deployment)

To update shift display or styling configs without redeploying:

```bash
# Edit config files locally
vim src/config/shift-display.config.json
vim src/config/shift-styling.config.json

# Upload to R2 (takes effect after 5min cache expiry)
./scripts/upload-config-to-r2.sh
```

## Rotating Secrets

### Change API Token
```bash
cd worker
wrangler secret put API_TOKEN
# Worker picks up new token immediately, no redeploy needed
```

### Change Access Password
```bash
cd worker
wrangler secret put ACCESS_PASSWORD
# Users will need to re-authenticate with new password
```

## Troubleshooting

### Worker Returns "API Token not found"
```bash
wrangler secret put API_TOKEN
# Ensure token is set correctly
```

### Frontend Shows Empty Grid
- Check browser console for CORS or network errors
- Verify `NEXT_PUBLIC_API_URL` is set to `/api` (relative path)
- Verify Worker service binding is configured in Pages Settings > Functions
- Test Worker endpoint directly with curl

### Telemetry Being Blocked by Script Blockers
If telemetry is blocked despite same-origin setup:
- Verify `NEXT_PUBLIC_API_URL=/api` (not absolute Worker URL)
- Check Pages Settings > Functions > Service bindings has `WORKER` binding
- Inspect browser console for 503 errors (indicates missing service binding)
- Test `/api/telemetry` endpoint responds (should return 401 without auth)
- Note: Some aggressive blockers may still block based on path/pattern - this is expected

### R2 Config Not Loading
```bash
# Verify buckets exist
wrangler r2 bucket list

# Re-upload configs
./scripts/upload-config-to-r2.sh
```

### Pages Build Fails
- Check build logs in Cloudflare dashboard
- Verify all `NEXT_PUBLIC_*` environment variables are set
- Ensure Node.js version is 18+ in build settings

## Monitoring

- Worker logs: `wrangler tail` or Cloudflare dashboard > Workers > Logs
- Pages deployment logs: Cloudflare dashboard > Pages > Deployments
- Access analytics: Cloudflare dashboard > Pages/Workers > Analytics

## Security Checklist

- [ ] `API_TOKEN` stored as Worker secret (never in code)
- [ ] `ACCESS_PASSWORD` is strong and stored as Worker secret
- [ ] Worker CORS allows only your domain (or wildcard for public data)
- [ ] R2 buckets are private (accessed only via Worker)
- [ ] Frontend uses HTTPS only (Cloudflare enforces this)
- [ ] No sensitive data in environment variables committed to git

## Cost Optimization

- Workers free tier: 100,000 requests/day
- Pages free tier: Unlimited requests, 500 builds/month
- R2 free tier: 10 GB storage, 1M reads/month
- Current config: 5min cache means ~288 API calls/day for 24/7 usage

Expected cost: Free tier sufficient for single-unit deployment.
