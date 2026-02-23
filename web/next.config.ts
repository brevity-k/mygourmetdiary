import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@mygourmetdiary/shared-types',
    '@mygourmetdiary/shared-constants',
    '@mygourmetdiary/shared-api',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
    ],
  },
};

export default nextConfig;
