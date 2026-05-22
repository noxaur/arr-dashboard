import { NextResponse } from "next/server";
import { services } from "@/lib/services";
import { arrFetch, formatUptime } from "@/lib/api";

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


