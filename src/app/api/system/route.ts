import { NextResponse } from "next/server";
import { services } from "@/lib/services";
import { getBasicAuth } from "@/lib/auth";

async function arrFetch(
  serviceId: string,
  endpoint: string
): Promise<Response> {
  const service = services[serviceId];
  if (!service) throw new Error(`Unknown service: ${serviceId}`);

  const apiKey = process.env[service.apiKeyEnv];
  if (!apiKey) {
    throw new Error(`Missing API key for ${serviceId} (env: ${service.apiKeyEnv})`);
  }

  const baseUrl = service.url.replace(/\/$/, "");
  const url = `${baseUrl}${service.apiEndpoint}${endpoint}`;

  return fetch(url, {
    headers: {
      "X-Api-Key": apiKey,
      Authorization: getBasicAuth(serviceId),
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
}

export async function GET() {
  const results: Record<string, { version: string; os: string; docker: boolean; uptime: string; status: string }> = {};

  const serviceConfigs = [
    { id: "radarr", endpoint: "/system/status" },
    { id: "sonarr", endpoint: "/system/status" },
    { id: "prowlarr", endpoint: "/system/status" },
    { id: "bazarr", endpoint: "/system/status" },
    { id: "jellyseerr", endpoint: "/status" },
  ];

  const promises = serviceConfigs.map(async ({ id, endpoint }) => {
    try {
      const res = await arrFetch(id, endpoint);
      if (!res.ok) {
        results[id] = { version: "unknown", os: "unknown", docker: false, uptime: "N/A", status: "offline" };
        return;
      }

      const data = await res.json();

      results[id] = {
        version: data.version || "unknown",
        os: data.osName || data.platform || "unknown",
        docker: data.isDocker || data.docker || false,
        uptime: data.uptime || formatUptime(data.startTime),
        status: "online",
      };
    } catch {
      results[id] = { version: "unknown", os: "unknown", docker: false, uptime: "N/A", status: "offline" };
    }
  });

  await Promise.all(promises);

  return NextResponse.json(results);
}

function formatUptime(startTime?: string): string {
  if (!startTime) return "N/A";
  const start = new Date(startTime).getTime();
  const now = Date.now();
  const diff = now - start;
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  return `${hours}h ${Math.floor((diff % 3600000) / 60000)}m`;
}
