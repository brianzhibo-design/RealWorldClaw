/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return process.env.NODE_ENV === "development"
      ? [
          {
            source: "/api/:path*",
            destination: "http://localhost:8000/api/:path*",
          },
        ]
      : [];
  },
  async redirects() {
    return [
      { source: '/devices', destination: '/map', permanent: true },
      { source: '/devices/:path*', destination: '/map/:path*', permanent: true },
      { source: '/maker-orders', destination: '/orders', permanent: true },
      { source: '/maker-orders/:path*', destination: '/orders/:path*', permanent: true },
    ];
  },
};

export default nextConfig;
