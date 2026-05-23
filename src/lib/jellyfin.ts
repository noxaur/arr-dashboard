import { env } from "./env";
import type { JellyfinSystemInfo } from "./types";
import { mockJellyfinSystemInfo } from "./mock-data";

function getJellyfinConfig() {
  return {
    url: env.JELLYFIN_URL || "",
    key: env.JELLYFIN_API_KEY || "",
  };
}

import type { ActivityEvent, EventType } from "@/lib/events";

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

interface JellyfinActivityEntry {
  Id: number;
  Name: string;
  Overview?: string;
  ShortOverview?: string;
  Type: string;
  Date: string;
  Severity: string;
  UserId: string;
}

export async function getJellyfinActivity(): Promise<ActivityEvent[]> {
  try {
    const res = await jellyfinFetch("/System/ActivityLog/Entries?StartIndex=0&Limit=2000");
    if (!res || !res.ok) return [];
    const data = await res.json();
    const items: JellyfinActivityEntry[] = data.Items || [];
    return items.map((item) => {
      let type: EventType = "refresh";
      const t = item.Type || "";
      if (t.includes("PlaybackStopped") || t.includes("PlaybackStop")) type = "import";
      else if (t.includes("Playback") || t.includes("Video")) type = "download";
      else if (t.includes("UserDownloading")) type = "download";
      else if (t.includes("AuthenticationSucceeded")) type = "import";
      else if (t.includes("Session") || t.includes("Login")) type = "import";
      else if (t.includes("Library") || t.includes("Update")) type = "refresh";
      else if (t.includes("Error") || t.includes("Exception") || item.Severity === "Error") type = "error";
      return {
        id: item.Id,
        service: "jellyfin",
        type,
        title: item.Name || "Activity",
        message: item.ShortOverview || item.Name || "",
        timestamp: item.Date || new Date().toISOString(),
      };
    });
  } catch {
    return [];
  }
}

export async function getJellyfinSystemInfo(): Promise<JellyfinSystemInfo | null> {
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

export async function getJellyfinSessions(): Promise<number> {
  if (env.USE_MOCK_DATA === "true") return 3;
  try {
    const res = await jellyfinFetch("/Sessions");
    if (!res || !res.ok) return 0;
    const data = await res.json();
    return data.filter((s: any) => s.NowPlayingItem)?.length || 0;
  } catch {
    return 0;
  }
}
