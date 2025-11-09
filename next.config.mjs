import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure static files are served correctly
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Image optimization
  images: {
    domains: ['worldathletics.org'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Headers for caching
  async headers() {
    return [
      {
        source: '/api/athletes',
        headers: [
          {
            key: 'Cache-Control',
            // Disable caching in development to avoid stale component code
            value: process.env.NODE_ENV === 'production' 
              ? 'public, s-maxage=3600, stale-while-revalidate=86400'
              : 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

export default withBundleAnalyzer(nextConfig);
