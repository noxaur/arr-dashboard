import { env } from "./env";

const SERVICE_KEYS = ["radarr", "sonarr", "prowlarr", "bazarr", "jellyseerr"] as const;
type ServiceId = (typeof SERVICE_KEYS)[number];

const envRecord = env as Record<string, string | undefined>;

function getBasicUser(serviceId: ServiceId | string): string {
  const key = `BASIC_USER_${serviceId.toUpperCase()}`;
  return envRecord[key] || env.ARR_BASIC_USER;
}

function getBasicPass(serviceId: ServiceId | string): string {
  const key = `BASIC_PASS_${serviceId.toUpperCase()}`;
  return envRecord[key] || env.ARR_BASIC_PASS;
}

export function getBasicAuth(serviceId: ServiceId | string): string | null {
  const user = getBasicUser(serviceId);
  const pass = getBasicPass(serviceId);
  if (!user && !pass) return null;
  return `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
}

export function getBasicCredentials(serviceId: ServiceId | string): { user: string; pass: string } {
  return {
    user: getBasicUser(serviceId),
    pass: getBasicPass(serviceId),
  };
}
