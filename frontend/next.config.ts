import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export', // static export for S3/CloudFront
  trailingSlash: true,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? '',
  },
};

export default nextConfig;
