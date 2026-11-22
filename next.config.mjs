/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['@prisma/client', 'prisma'],
  poweredByHeader: false,
  devIndicators: false,
};

export default nextConfig;
