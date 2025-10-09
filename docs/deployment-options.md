# Deployment Options for Schedule Viewer

## Context

The password gate feature requires server-side rendering, which changed our deployment approach. This document outlines the available options.

## Option 1: OpenNext Cloudflare Adapter (Full Node.js Runtime)

**Best for**: Apps using Node.js APIs like `crypto.timingSafeEqual`

### Setup

```bash
# Install adapter
npm install --save-dev @opennextjs/cloudflare

# Add scripts
npm pkg set scripts.pages:build="npx @opennextjs/cloudflare"
npm pkg set scripts.pages:deploy="npm run pages:build && wrangler pages deploy .open-next/worker"
```

### Configuration

Create `wrangler.toml` in project root:

```toml
name = "schedule-viewer"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]

[vars]
NEXT_PUBLIC_API_URL = "https://schedule-viewer-worker.your-account.workers.dev/api"
NEXT_PUBLIC_DEFAULT_UNIT_NAME = "Emergency Department"
NEXT_PUBLIC_SHIFT_CODE_DICT = '{"D":{"label":"Day"},"N":{"label":"Night"},"O":{"label":"Off"}}'
```

### Deployment

```bash
# Set secret (only once)
npx wrangler secret put ACCESS_PASSWORD

# Deploy
npm run pages:deploy
```

### Pros
- ✅ Full Node.js runtime support
- ✅ Works with existing crypto implementation
- ✅ No code changes needed

### Cons
- ❌ More complex deployment
- ❌ Requires wrangler CLI
- ❌ Additional build step

---

## Option 2: Edge Runtime with Simple Password Check

**Best for**: Simpler deployment, Cloudflare Pages dashboard integration

### Code Changes Required

Modify `src/app/api/access/route.ts` to use simple string comparison:

```typescript
import { NextResponse } from 'next/server'
import { ACCESS_COOKIE, ACCESS_COOKIE_MAX_AGE } from '@/lib/auth'

export const runtime = 'edge' // Enable Edge Runtime

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const password = body?.password

  if (typeof password !== 'string' || password.trim().length === 0) {
    return NextResponse.json({ error: 'Password richiesta.' }, { status: 400 })
  }

  const expectedPassword = process.env.ACCESS_PASSWORD

  if (!expectedPassword) {
    return NextResponse.json({ error: 'Password non configurata.' }, { status: 500 })
  }

  // Simple string comparison (Edge Runtime compatible)
  // Note: Not timing-safe, but acceptable for low-security scenarios
  if (password.trim() !== expectedPassword) {
    return NextResponse.json({ error: 'Password non valida. Riprova.' }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })

  response.cookies.set({
    name: ACCESS_COOKIE,
    value: 'granted',
    httpOnly: true,
    path: '/',
    maxAge: ACCESS_COOKIE_MAX_AGE,
    sameSite: 'strict',
    secure: true,
  })

  return response
}
```

### Deployment via Cloudflare Dashboard

1. Go to Cloudflare dashboard → Pages
2. Connect GitHub repository
3. Framework preset: **Next.js**
4. Build command: `npm run build`
5. Build output directory: (leave default)
6. Environment variables:
   - `ACCESS_PASSWORD`
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_DEFAULT_UNIT_NAME`
   - `NEXT_PUBLIC_SHIFT_CODE_DICT`

### Pros
- ✅ Simpler deployment
- ✅ GitHub integration
- ✅ Automatic deployments
- ✅ No wrangler CLI needed

### Cons
- ❌ Requires code modification
- ❌ Less secure password comparison (timing attacks possible)
- ❌ Limited to Edge Runtime APIs

---

## Option 3: Alternative Hosting (Vercel/Netlify)

If Cloudflare complexity is too high, consider:

- **Vercel**: Native Next.js support, zero config
- **Netlify**: Good Next.js support, environment variables UI

Both support full Node.js runtime out of the box.

---

## Recommendation

**For Production**: Use **Option 1** (OpenNext) for security best practices

**For Quick Testing**: Use **Option 2** (Edge Runtime) for simplicity

**For Long-term**: Consider **Option 3** (Vercel) if Cloudflare Workers complexity is unwanted
