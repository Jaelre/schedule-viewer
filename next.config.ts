import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'export',
  // Note: Back to static export! Password gate now handled by Rust worker
  // Deploy out/ directory to Cloudflare Pages (static hosting)
}

export default nextConfig
