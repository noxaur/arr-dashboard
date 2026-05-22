import { NextResponse } from "next/server";
import { fetchAllServices } from "@/lib/arr-service";
import type { SystemInfo } from "@/lib/types";

export async function GET() {
  const entries = await fetchAllServices<SystemInfo>("system");

  const result = Object.fromEntries(
    Object.entries(entries).map(([id, info]) => [
      id,
      {
        version: info.version || "unknown",
        os: info.os || "unknown",
        docker: info.docker || false,
        uptime: info.uptime || "N/A",
        status: info.os === "unknown" ? "offline" : "online",
      },
    ])
  );

  return NextResponse.json(result);
}
