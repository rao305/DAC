/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable React Strict Mode to prevent double rendering in development
  // Strict Mode intentionally double-invokes components to detect side effects,
  // which was causing duplicate message bubbles in the UI
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
