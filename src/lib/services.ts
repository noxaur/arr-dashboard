import { env } from "./env";
import type { ServiceConfig } from "./types";

export type { ServiceConfig };

export const services: Record<string, ServiceConfig> = {
  radarr: {
    id: "radarr",
    name: "Radarr",
    description: "Movie management",
    url: env.RADARR_URL,
    apiEndpoint: "/api/v3",
    icon: "M",
    color: "oklch(65% 0.15 30)",
    apiKeyEnv: "RADARR_API_KEY",
  },
  sonarr: {
    id: "sonarr",
    name: "Sonarr",
    description: "TV series management",
    url: env.SONARR_URL,
    apiEndpoint: "/api/v3",
    icon: "S",
    color: "oklch(62% 0.14 170)",
    apiKeyEnv: "SONARR_API_KEY",
  },
  prowlarr: {
    id: "prowlarr",
    name: "Prowlarr",
    description: "Indexer management",
    url: env.PROWLARR_URL,
    apiEndpoint: "/api/v1",
    icon: "P",
    color: "oklch(60% 0.12 280)",
    apiKeyEnv: "PROWLARR_API_KEY",
  },
  bazarr: {
    id: "bazarr",
    name: "Bazarr",
    description: "Subtitle management",
    url: env.BAZARR_URL,
    apiEndpoint: "/api",
    icon: "B",
    color: "oklch(62% 0.12 220)",
    apiKeyEnv: "BAZARR_API_KEY",
  },
  jellyseerr: {
    id: "jellyseerr",
    name: "Jellyseerr",
    description: "Request management",
    url: env.JELLYSEERR_URL,
    apiEndpoint: "/api/v1",
    icon: "J",
    color: "oklch(62% 0.14 340)",
    apiKeyEnv: "JELLYSEERR_API_KEY",
  },
};

export const serviceOrder = ["radarr", "sonarr", "prowlarr", "bazarr", "jellyseerr"];
