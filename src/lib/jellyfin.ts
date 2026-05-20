const JELLYFIN_URL = process.env.JELLYFIN_URL || "";
const JELLYFIN_KEY = process.env.JELLYFIN_API_KEY || "";

async function jellyfinFetch(endpoint: string): Promise<Response | null> {
  if (!JELLYFIN_URL || !JELLYFIN_KEY) return null;

  const maxRetries = 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(`${JELLYFIN_URL}${endpoint}`, {
        headers: { "X-Emby-Token": JELLYFIN_KEY },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
      return res;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  return null;
}

export async function getJellyfinSystemInfo() {
  try {
    const res = await jellyfinFetch("/System/Info");
    if (!res || !res.ok) return null;
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
    const res = await jellyfinFetch("/Sessions");
    if (!res || !res.ok) return 0;
    const data = await res.json();
    return data.filter((s: any) => s.NowPlayingItem)?.length || 0;
  } catch {
    return 0;
  }
}
