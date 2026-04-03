/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  // When CAPACITOR_BUILD=1 (for APK), export as static HTML
  ...(process.env.CAPACITOR_BUILD === '1' && { output: 'export' }),

  images: {
    // Static export requires unoptimized images (Capacitor APK build)
    unoptimized: process.env.CAPACITOR_BUILD === '1',
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 3600, // 1 hour in seconds
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'phebcjcuzembjqzftzix.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.cloudflare.com',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'www.svgrepo.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },

  experimental: {
    // CSS optimization disabled: next-with-plugins can cause build issues with Tailwind 3.4
    optimizeCss: false,
  },

  // Cache and security headers (web server only, not used in static export)
  async headers() {
    if (process.env.CAPACITOR_BUILD === '1') return [];
    return [
      {
        // Security headers on all routes
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
      {
        // Cache static assets aggressively
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/icons/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
    ];
  },
}

module.exports = nextConfig
