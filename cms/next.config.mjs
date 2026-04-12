const BACKEND_URL = process.env.BACKEND_URL
  ?? (process.env.NODE_ENV === 'production' ? 'http://127.0.0.1:8100' : 'http://localhost:3000');

const nextConfig = {
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