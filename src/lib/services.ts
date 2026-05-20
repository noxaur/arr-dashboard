export interface ServiceConfig {
  id: string;
  name: string;
  description: string;
  url: string;
  embedUrl: string;
  apiUrl: string;
  apiEndpoint: string;
  icon: string;
  color: string;
  apiKeyEnv: string;
}

export const services: Record<string, ServiceConfig> = {
  radarr: {
    id: "radarr",
    name: "Radarr",
    description: "Movie management",
    url: process.env.RADARR_URL || "https://jellyradarr-admin.opsec.rent",
    embedUrl: "/api/embed/radarr",
    apiUrl: "/api/radarr",
    apiEndpoint: "/api/v3",
    icon: "M",
    color: "oklch(65% 0.15 30)",
    apiKeyEnv: "RADARR_API_KEY",
  },
  sonarr: {
    id: "sonarr",
    name: "Sonarr",
    description: "TV series management",
    url: process.env.SONARR_URL || "https://jellysonarr-admin.opsec.rent",
    embedUrl: "/api/embed/sonarr",
    apiUrl: "/api/sonarr",
    apiEndpoint: "/api/v3",
    icon: "S",
    color: "oklch(62% 0.14 170)",
    apiKeyEnv: "SONARR_API_KEY",
  },
  prowlarr: {
    id: "prowlarr",
    name: "Prowlarr",
    description: "Indexer management",
    url: process.env.PROWLARR_URL || "https://jellyprowlarr-admin.opsec.rent",
    embedUrl: "/api/embed/prowlarr",
    apiUrl: "/api/prowlarr",
    apiEndpoint: "/api/v1",
    icon: "P",
    color: "oklch(60% 0.12 280)",
    apiKeyEnv: "PROWLARR_API_KEY",
  },
  bazarr: {
    id: "bazarr",
    name: "Bazarr",
    description: "Subtitle management",
    url: process.env.BAZARR_URL || "https://jellybazarr.opsec.rent",
    embedUrl: "/api/embed/bazarr",
    apiUrl: "/api/bazarr",
    apiEndpoint: "/api",
    icon: "B",
    color: "oklch(62% 0.12 220)",
    apiKeyEnv: "BAZARR_API_KEY",
  },
  jellyseerr: {
    id: "jellyseerr",
    name: "Jellyseerr",
    description: "Request management",
    url: process.env.JELLYSEERR_URL || "https://jellyseerr.opsec.rent",
    embedUrl: "/api/embed/jellyseerr",
    apiUrl: "/api/jellyseerr",
    apiEndpoint: "/api/v1",
    icon: "J",
    color: "oklch(62% 0.14 340)",
    apiKeyEnv: "JELLYSEERR_API_KEY",
  },
};

export const serviceOrder = ["radarr", "sonarr", "prowlarr", "bazarr", "jellyseerr"];
