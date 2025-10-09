import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Note: Changed from 'export' to support server-side password gate
  // Deploy to Cloudflare Pages with @cloudflare/next-on-pages
  // Worker still handles /api/shifts endpoint
}

export default nextConfig
