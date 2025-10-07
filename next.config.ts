import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'export',
  // Note: For Cloudflare Pages deployment, you'll use the Worker for API routes
  // Local development uses Next.js API routes
}

export default nextConfig
