const JELLYFIN_URL = process.env.JELLYFIN_URL || "https://jellyox.opsec.rent";
const JELLYFIN_KEY = process.env.JELLYFIN_API_KEY || "";

export async function getJellyfinSystemInfo() {
  try {
    const res = await fetch(`${JELLYFIN_URL}/System/Info`, {
      headers: { "X-Emby-Token": JELLYFIN_KEY },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    const osName = data.OperatingSystemDisplayName || data.OperatingSystem || "Linux (Docker)";
    return {
      os: osName,
      version: data.Version || "unknown",
      architecture: data.SystemArchitecture || "unknown",
      startTime: data.StartupTimeCompleted || null,
      serverName: data.ServerName || "Jellyfin",
    };
  } catch {
    return null;
  }
}

export async function getJellyfinSessions() {
  try {
    const res = await fetch(`${JELLYFIN_URL}/Sessions`, {
      headers: { "X-Emby-Token": JELLYFIN_KEY },
      cache: "no-store",
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return data.filter((s: any) => s.NowPlayingItem)?.length || 0;
  } catch {
    return 0;
  }
}
