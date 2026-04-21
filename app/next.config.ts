import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.parqet.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
