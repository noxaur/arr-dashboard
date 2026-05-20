import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/radarr/:path*",
        destination: `${process.env.RADARR_URL || "https://jellyradarr-admin.opsec.rent"}/:path*`,
      },
      {
        source: "/api/sonarr/:path*",
        destination: `${process.env.SONARR_URL || "https://jellysonarr-admin.opsec.rent"}/:path*`,
      },
      {
        source: "/api/prowlarr/:path*",
        destination: `${process.env.PROWLARR_URL || "https://jellyprowlarr-admin.opsec.rent"}/:path*`,
      },
      {
        source: "/api/bazarr/:path*",
        destination: `${process.env.BAZARR_URL || "https://jellybazarr.opsec.rent"}/:path*`,
      },
      {
        source: "/api/jellyseerr/:path*",
        destination: `${process.env.JELLYSEERR_URL || "https://jellyseerr.opsec.rent"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
