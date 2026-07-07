import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@metalink/core', '@metalink/db'],
};

export default nextConfig;
