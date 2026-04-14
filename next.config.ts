import type { NextConfig } from "next";

const publicAssetCacheControl = "public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=86400";

const nextConfig: NextConfig = {
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
