/** @type {import('next').NextConfig} */

// In production (Vercel), BACKEND_URL must be set to the deployed backend URL.
// Locally it defaults to http://localhost:3001.
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

if (process.env.NODE_ENV === 'production' && !process.env.BACKEND_URL) {
  throw new Error(
    'BACKEND_URL env var is required in production. ' +
    'Set it in your Vercel project settings to the deployed backend URL.',
  );
}

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        // Proxy all /api/v1/* calls from browser → backend (same-origin, avoids CORS/cookie issues)
        source: '/api/v1/:path*',
        destination: `${BACKEND_URL}/api/v1/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;

