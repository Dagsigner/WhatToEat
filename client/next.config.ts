import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_PROXY_TARGET || "http://localhost:8000"}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_PROXY_TARGET || "http://localhost:8000"}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
