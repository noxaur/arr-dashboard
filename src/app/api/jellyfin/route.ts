import { NextResponse } from "next/server";

const JELLYFIN_URL = process.env.JELLYFIN_URL;
const JELLYFIN_KEY = process.env.JELLYFIN_API_KEY;

export async function GET() {
  if (!JELLYFIN_KEY) {
    return NextResponse.json({ error: "Missing JELLYFIN_API_KEY" }, { status: 500 });
  }

  if (!JELLYFIN_URL) {
    return NextResponse.json({ error: "Missing JELLYFIN_URL" }, { status: 500 });
  }

  try {
    const [systemRes, sessionsRes] = await Promise.all([
      fetch(`${JELLYFIN_URL}/System/Info`, {
        headers: { "X-Emby-Token": JELLYFIN_KEY },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      }),
      fetch(`${JELLYFIN_URL}/Sessions?controllableByUserId=`, {
        headers: { "X-Emby-Token": JELLYFIN_KEY },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      }),
    ]);

    const system = systemRes.ok ? await systemRes.json() : null;
    const sessions = sessionsRes.ok ? await sessionsRes.json() : [];

    return NextResponse.json({
      os: system?.OperatingSystemDisplayName || "unknown",
      version: system?.Version || "unknown",
      architecture: system?.SystemArchitecture || "unknown",
      uptime: system?.StartupTimeCompleted || null,
      activeStreams: sessions?.filter((s: any) => s.NowPlayingItem)?.length || 0,
      serverName: system?.ServerName || "Jellyfin",
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch Jellyfin info" }, { status: 500 });
  }
}
