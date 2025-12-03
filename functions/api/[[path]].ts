/**
 * Cloudflare Pages Function: API Proxy
 *
 * This function proxies all /api/* requests to the Worker service.
 * This ensures the frontend and API are same-origin, preventing
 * script blockers from blocking telemetry as cross-site tracking.
 *
 * To bind the Worker service:
 * 1. Deploy your Worker: cd worker && wrangler deploy
 * 2. In Cloudflare Pages dashboard:
 *    Settings > Functions > Service bindings
 *    Add binding: WORKER = schedule-viewer-worker
 */

interface Env {
  WORKER: {
    fetch: (request: Request) => Promise<Response>
  }
}

export const onRequest = async (context: {
  request: Request
  env: Env
}): Promise<Response> => {
  const { request, env } = context

  // Check if Worker service binding exists
  if (!env.WORKER) {
    console.error('WORKER service binding not configured')
    return new Response(
      JSON.stringify({
        error: 'Worker service not configured',
        hint: 'Add WORKER service binding in Pages settings pointing to schedule-viewer-worker',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  try {
    // Forward the request to the Worker service
    // The Worker will handle /api/* routes internally
    const response = await env.WORKER.fetch(request)

    // Clone response to ensure it's properly formatted
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    })
  } catch (error) {
    console.error('Error proxying to Worker:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to proxy request to Worker',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
