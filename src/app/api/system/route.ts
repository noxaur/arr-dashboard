import { NextResponse } from "next/server";
import { getSystemInfo } from "@/lib/api";
import { serviceOrder } from "@/lib/services";

export async function GET() {
  const entries = await Promise.all(
    serviceOrder.map(async (id) => {
      const info = await getSystemInfo(id);
      return [
        id,
        {
          version: info.version || "unknown",
          os: info.os || "unknown",
          docker: info.docker || false,
          uptime: info.uptime || "N/A",
          status: info.os === "unknown" ? "offline" : "online",
        },
      ] as const;
    })
  );

  return NextResponse.json(Object.fromEntries(entries));
}


