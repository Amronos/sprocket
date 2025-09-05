import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    dirs: ['app', 'pages', 'components', 'src'],
  },
};

export default nextConfig;
