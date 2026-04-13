import type { NextConfig } from 'next';

const BACKEND_URL = process.env.BACKEND_URL
  ?? (process.env.NODE_ENV === 'production' ? 'http://127.0.0.1:8100' : 'http://localhost:8100');

const nextConfig: NextConfig = {
  // Proxy /api/backend/* → NestJS during dev
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${BACKEND_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
