import type { NextConfig } from "next";

const publicAssetCacheControl = "public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=86400";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.7.142",
    "192.168.7.142:3000",
    "192.168.7.142:3001",
    "localhost",
    "localhost:3000"
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "*.ufs.sh",
      },
      {
        protocol: "https",
        hostname: "*.uploadthing.com",
      },
      
    ],
  },
  async headers() {
    return [
      {
        source: "/:path((?!_next/).*)\\.(svg|png|jpg|jpeg|gif|webp|avif|ico|woff|woff2|ttf|otf)",
        headers: [
          {
            key: "Cache-Control",
            value: publicAssetCacheControl,
          },
        ],
        
      },
    ];
  },
};

export default nextConfig;
