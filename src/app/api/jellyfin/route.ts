import { NextResponse } from "next/server";
import { getJellyfinSystemInfo, getJellyfinSessions } from "@/lib/jellyfin";

export async function GET() {
  try {
    const [info, activeStreams] = await Promise.all([
      getJellyfinSystemInfo(),
      getJellyfinSessions(),
    ]);

    return NextResponse.json({
      os: info?.os || "unknown",
      version: info?.version || "unknown",
      architecture: info?.architecture || "unknown",
      uptime: info?.startTime || null,
      activeStreams,
      serverName: info?.serverName || "Jellyfin",
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch Jellyfin info" }, { status: 500 });
  }
}
