import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "supabase.carubra.com",
        pathname: "/storage/v1/object/public/**",
      },
      // {
      //   protocol: "http",
      //   hostname: "localhost",
      //   port: "8000",
      //   pathname: "/storage/v1/object/public/**",
      // },
    ],
  },
  allowedDevOrigins: [
    "localhost",
    "localhost:3000",
    "lvh.me",
    "lvh.me:3000",
    "localhost:8000",
    "localhost:3002",
    "dash-doa.carubra.com",
    "https://dash-doa.carubra.com",
  ],
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "0" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
