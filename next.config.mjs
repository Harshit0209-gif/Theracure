/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  devIndicators: {
    buildActivity: false
  },
  // Disable Next.js Dev Tools
  experimental: {
    devOverlay: false,
  }
}

export default nextConfig
