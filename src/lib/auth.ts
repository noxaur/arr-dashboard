const SERVICE_KEYS = ["radarr", "sonarr", "prowlarr", "bazarr", "jellyseerr"] as const;
type ServiceId = (typeof SERVICE_KEYS)[number];

export function getBasicAuth(serviceId: ServiceId | string): string | null {
  const user = process.env[`BASIC_USER_${serviceId.toUpperCase()}`] || process.env.ARR_BASIC_USER || "";
  const pass = process.env[`BASIC_PASS_${serviceId.toUpperCase()}`] || process.env.ARR_BASIC_PASS || "";
  if (!user && !pass) return null;
  return `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
}

export function getBasicCredentials(serviceId: ServiceId | string): { user: string; pass: string } {
  return {
    user: process.env[`BASIC_USER_${serviceId.toUpperCase()}`] || process.env.ARR_BASIC_USER || "",
    pass: process.env[`BASIC_PASS_${serviceId.toUpperCase()}`] || process.env.ARR_BASIC_PASS || "",
  };
}
