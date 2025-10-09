# Worker-Based Password Gate Implementation

## Architecture

Instead of requiring Next.js SSR, consolidate password checking into the existing Rust Cloudflare Worker:

```
┌─────────┐     ┌──────────────────┐     ┌──────────┐
│ Browser │────▶│ Rust Worker      │────▶│ MetricAid│
│         │◀────│ /api/access      │◀────│   API    │
└─────────┘     │ /api/shifts      │     └──────────┘
                └──────────────────┘
                        │
                        ▼
                   [Cookies]
```

**Benefits:**
- ✅ Single worker handles all logic
- ✅ Keep Next.js as static export (simpler deployment)
- ✅ Secure constant-time password comparison in Rust
- ✅ No OpenNext complexity
- ✅ Client-side password form

## Implementation Steps

### 1. Add Dependencies to `worker/Cargo.toml`

```toml
[dependencies]
# ... existing deps ...
constant_time_eq = "0.3"
```

### 2. Add Password Check Route to Worker

Add to `worker/src/lib.rs` router:

```rust
// Add after existing imports
use constant_time_eq::constant_time_eq;

// Add password check structs
#[derive(Deserialize)]
struct AccessRequest {
    password: String,
}

#[derive(Serialize)]
struct AccessResponse {
    success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

// Update router in main()
router
    .post_async("/api/access", |mut req, ctx| async move {
        handle_access(req, ctx).await
    })
    .get_async("/api/shifts", |req, ctx| async move {
        handle_shifts(req, ctx).await
    })
    .run(req, env)
    .await

// Add handler function
async fn handle_access(mut req: Request, ctx: RouteContext<()>) -> Result<Response> {
    // Parse request body
    let body: AccessRequest = match req.json().await {
        Ok(b) => b,
        Err(_) => {
            return Response::error("Invalid JSON", 400);
        }
    };

    // Get expected password from environment
    let expected_password = match ctx.secret("ACCESS_PASSWORD") {
        Ok(secret) => secret.to_string(),
        Err(_) => {
            return Response::error("Password not configured", 500);
        }
    };

    let candidate = body.password.trim();
    let expected = expected_password.trim();

    // Constant-time comparison
    let is_valid = constant_time_eq(candidate.as_bytes(), expected.as_bytes());

    if !is_valid {
        let response = AccessResponse {
            success: false,
            error: Some("Password non valida. Riprova.".to_string()),
        };
        let mut resp = Response::from_json(&response)?;
        resp.with_status(401);
        return add_cors_headers(resp);
    }

    // Success - set cookie
    let response = AccessResponse {
        success: true,
        error: None,
    };

    let mut resp = Response::from_json(&response)?;

    // Set HttpOnly cookie with 10-year expiration
    let cookie = "schedule_viewer_access=granted; Path=/; Max-Age=315360000; HttpOnly; SameSite=Strict; Secure";
    resp.headers_mut().append("Set-Cookie", cookie)?;

    add_cors_headers(resp)
}

// Helper to add CORS headers (update existing handle_options if needed)
fn add_cors_headers(mut response: Response) -> Result<Response> {
    let headers = response.headers_mut();
    headers.set("Access-Control-Allow-Origin", "*")?;
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")?;
    headers.set("Access-Control-Allow-Headers", "Content-Type")?;
    headers.set("Access-Control-Max-Age", "86400")?;
    Ok(response)
}
```

### 3. Set Worker Secret

```bash
cd worker
wrangler secret put ACCESS_PASSWORD
# Enter: Policlinico1
```

### 4. Update Frontend to Client-Side Check

Modify `src/app/page.tsx`:

```typescript
// Remove server-side cookie check
export default function Page() {
  return <PasswordGate />
}
```

Update `src/app/_components/PasswordGate.tsx` to check cookie client-side:

```typescript
'use client'

import { useState, useEffect } from 'react'

export function PasswordGate({ children }: { children: ReactNode }) {
  const [hasAccess, setHasAccess] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Check for cookie on mount
    const hasCookie = document.cookie.includes('schedule_viewer_access=granted')
    setHasAccess(hasCookie)
    setIsChecking(false)
  }, [])

  if (isChecking) {
    return <LoadingSpinner />
  }

  if (hasAccess) {
    return <>{children}</>
  }

  return <PasswordForm onSuccess={() => setHasAccess(true)} />
}
```

### 5. Revert Next.js to Static Export

`next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'export',
  // Back to static export!
}
```

### 6. Update Frontend API URL

`.env.local`:

```bash
# Point to worker for BOTH password check and shifts
NEXT_PUBLIC_API_URL=http://localhost:8787/api
```

### 7. Remove Server-Side API Route

```bash
rm -rf src/app/api/
```

## Deployment

### Worker
```bash
cd worker
wrangler secret put ACCESS_PASSWORD
wrangler deploy
```

### Frontend (Static)
```bash
npm run build
# Deploy out/ directory to Cloudflare Pages (static hosting)
```

## Why This Is Better

| Aspect | SSR Approach | Worker Approach |
|--------|--------------|-----------------|
| Next.js | Complex (OpenNext) | Simple (static) |
| Deployment | Two configs | One config |
| Security | Node.js crypto | Rust constant-time |
| Performance | SSR overhead | Static + Worker |
| Maintenance | Multiple systems | Single worker |

## Testing

```bash
# Terminal 1: Run worker
cd worker && wrangler dev

# Terminal 2: Run frontend
npm run dev

# Test password endpoint
curl -X POST http://localhost:8787/api/access \
  -H "Content-Type: application/json" \
  -d '{"password":"Policlinico1"}'
```
