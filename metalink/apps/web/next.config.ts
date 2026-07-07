import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@metalink/core', '@metalink/db'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Hardening básico: painel lida com dados sensíveis de saúde.
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
