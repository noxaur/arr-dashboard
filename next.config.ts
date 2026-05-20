import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/radarr/:path*",
        destination: `${process.env.RADARR_URL || ""}/:path*`,
      },
      {
        source: "/api/sonarr/:path*",
        destination: `${process.env.SONARR_URL || ""}/:path*`,
      },
      {
        source: "/api/prowlarr/:path*",
        destination: `${process.env.PROWLARR_URL || ""}/:path*`,
      },
      {
        source: "/api/bazarr/:path*",
        destination: `${process.env.BAZARR_URL || ""}/:path*`,
      },
      {
        source: "/api/jellyseerr/:path*",
        destination: `${process.env.JELLYSEERR_URL || ""}/:path*`,
      },
    ];
  },
};

export default nextConfig;
