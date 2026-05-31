import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  output: "standalone",
  images: {
    unoptimized: process.env.HYDROTION_IMAGE_OPTIMIZATION === "off",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.amazonaws.com"
      },
      {
        protocol: "https",
        hostname: "*.notion-static.com"
      },
      {
        protocol: "https",
        hostname: "prod-files-secure.s3.us-west-2.amazonaws.com"
      },
      {
        protocol: "https",
        hostname: "www.notion.so"
      }
    ]
  }
};

export default nextConfig;
