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

Create production environment variables for the frontend build:

```bash
# In project root, create .env.production or configure in Cloudflare Pages UI
cat > .env.production << 'EOF'
NEXT_PUBLIC_API_URL=https://your-worker-url.workers.dev/api
NEXT_PUBLIC_DEFAULT_UNIT_NAME="Emergency Department"
NEXT_PUBLIC_SHIFT_CODE_DICT='{"D":{"label":"Day"},"N":{"label":"Night"},"O":{"label":"Off"}}'
EOF
```

Update `NEXT_PUBLIC_API_URL` with your actual Worker URL from Step 3.

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

## Step 8: Verify Deployment

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

## Step 9: Configure Custom Domain (Optional)

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
- Verify `NEXT_PUBLIC_API_URL` points to correct Worker URL
- Test Worker endpoint directly with curl

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
