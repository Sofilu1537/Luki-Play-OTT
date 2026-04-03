import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Proxy /api/backend/* → NestJS during dev
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${process.env.BACKEND_URL ?? 'http://localhost:3000'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
