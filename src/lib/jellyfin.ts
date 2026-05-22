function getJellyfinConfig() {
  return {
    url: process.env.JELLYFIN_URL || "",
    key: process.env.JELLYFIN_API_KEY || "",
  };
}

async function jellyfinFetch(endpoint: string): Promise<Response | null> {
  const { url, key } = getJellyfinConfig();
  if (!url || !key) return null;

  const maxRetries = 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(`${url}${endpoint}`, {
        headers: { "X-Emby-Token": key },
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

  console.error(`Jellyfin fetch failed after ${maxRetries + 1} attempts:`, lastError?.message);
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
