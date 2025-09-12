import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    dirs: ['app', 'pages', 'components', 'src'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'workoscdn.com',
      },
    ],
  },
};

export default nextConfig;
