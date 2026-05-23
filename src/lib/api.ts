import { env } from "./env";
import { services } from "./services";
import { getBasicAuth } from "./auth";
import { formatBytes } from "./format";
import type { HealthStatus, QueueItem, ActivityEvent, DiskSpace, SystemInfo } from "./types";
import { mockHealth, mockQueue, mockActivity } from "./mock-data";

function isMock() {
  return env.USE_MOCK_DATA === "true";
}

async function arrFetch(
  serviceId: string,
  endpoint: string,
  options?: RequestInit
): Promise<Response> {
  const service = services[serviceId];
  if (!service) throw new Error(`Unknown service: ${serviceId}`);

  const baseUrl = service.url.replace(/\/$/, "");
  if (!baseUrl) {
    throw new Error(`Missing URL for ${serviceId} (env: ${service.id.toUpperCase()}_URL)`);
  }

  const apiKey = (env as Record<string, string | undefined>)[service.apiKeyEnv];
  if (!apiKey) {
    throw new Error(`Missing API key for ${serviceId} (env: ${service.apiKeyEnv})`);
  }

  const url = `${baseUrl}${service.apiEndpoint}${endpoint}`;

  const maxRetries = 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const auth = getBasicAuth(serviceId);
      const headers: Record<string, string> = {
        "X-Api-Key": apiKey,
        "Content-Type": "application/json",
      };
      if (options?.headers) {
        Object.assign(headers, options.headers);
      }
      if (auth) {
        headers.Authorization = auth;
      }

      const res = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(15000),
        headers,
        cache: "no-store",
      });
      return res;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "";
      const isConfigError = msg.startsWith("Missing") || msg.startsWith("Unknown service");
      if (isConfigError) throw error;

      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error(`Failed to fetch ${serviceId}`);
}

export { arrFetch };

export async function checkHealth(serviceId: string): Promise<HealthStatus> {
  if (isMock()) return mockHealth[serviceId];

  try {
    const start = Date.now();

    let res: Response;
    if (serviceId === "bazarr") {
      res = await arrFetch(serviceId, "/system/status");
    } else if (serviceId === "jellyseerr") {
      res = await arrFetch(serviceId, "/settings/main");
    } else {
      res = await arrFetch(serviceId, "/system/status");
    }

    const responseTime = Date.now() - start;

    if (!res.ok) {
      return {
        status: "error",
        message: `HTTP ${res.status}: ${res.statusText}`,
        version: "unknown",
        responseTime,
      };
    }

    const data = await res.json();

    if (serviceId === "jellyseerr") {
      return {
        status: data.apiKey ? "healthy" : "warning",
        message: data.apiKey ? "All systems operational" : "API key not configured",
        version: data.version || "unknown",
        responseTime,
      };
    }

    return {
      status: "healthy",
      message: "All systems operational",
      version: data.version || "unknown",
      responseTime,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connection failed";
    const isTimeout = message.includes("timed out") || message.includes("AbortError");
    return {
      status: "error" as const,
      message: isTimeout ? "Request timed out" : `Fetch error: ${message}`,
      version: "unknown",
      responseTime: 0,
    };
  }
}

export async function getDiskSpace(serviceId: string): Promise<DiskSpace> {
  if (isMock()) {
    return { used: "0 MB", total: "N/A", percent: 0 };
  }

  if (serviceId === "prowlarr" || serviceId === "jellyseerr" || serviceId === "bazarr") {
    return { used: "0 MB", total: "N/A", percent: 0 };
  }

  try {
    const res = await arrFetch(serviceId, `/diskspace?t=${Date.now()}`);
    if (!res.ok) return { used: "0 MB", total: "N/A", percent: 0 };

    const data: Array<{ path: string; freeSpace: number; totalSpace: number }> = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      return { used: "0 MB", total: "N/A", percent: 0 };
    }

    const uniqueDisks = new Map<number, { freeSpace: number; totalSpace: number }>();
    for (const mount of data) {
      if (!uniqueDisks.has(mount.totalSpace)) {
        uniqueDisks.set(mount.totalSpace, { freeSpace: mount.freeSpace, totalSpace: mount.totalSpace });
      }
    }

    let totalBytes = 0;
    let freeBytes = 0;
    for (const disk of uniqueDisks.values()) {
      totalBytes += disk.totalSpace;
      freeBytes += disk.freeSpace;
    }

    const usedBytes = Math.max(0, totalBytes - freeBytes);
    const percent = totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 100) : 0;

    return {
      used: formatBytes(usedBytes),
      total: formatBytes(totalBytes),
      percent,
      usedBytes,
      totalBytes,
      mounts: data.map(m => ({ path: m.path, used: formatBytes(m.totalSpace - m.freeSpace), total: formatBytes(m.totalSpace) })),
    };
  } catch {
    return { used: "0 MB", total: "N/A", percent: 0 };
  }
}

export { formatBytes } from "./format";

export async function getQueue(serviceId: string): Promise<QueueItem[]> {
  if (isMock()) return mockQueue.filter((q) => q.service === serviceId);

  try {
    let res: Response;

    if (serviceId === "prowlarr") {
      return [];
    } else if (serviceId === "bazarr") {
      return [];
    } else if (serviceId === "jellyseerr") {
      res = await arrFetch(serviceId, "/request?take=20&skip=0&sort=added&filter=processing&includeAll=false");
    } else {
      res = await arrFetch(serviceId, "/queue?includeUnknownMovieItems=true&includeUnknownSeriesItems=true");
    }

    if (!res.ok) return [];

    const data = await res.json();

    if (serviceId === "jellyseerr") {
      return (data.results || []).map((item: any, i: number) => ({
        id: i,
        title: item.media?.title || "Unknown",
        progress: 0,
        status: "queued" as const,
        size: "N/A",
        sizeLeft: "N/A",
        eta: "N/A",
        service: serviceId,
      }));
    }

    return (data.records || data || []).map((item: any) => ({
      id: item.id,
      title: item.movie?.title || item.series?.title || item.title || "Unknown",
      progress: item.status === "downloading" && item.size > 0 ? Math.round(Math.min(100, Math.max(0, ((item.size - (item.sizeleft || 0)) / item.size) * 100))) : 0,
      status: item.status === "downloading" ? "downloading" as const : item.status === "importing" ? "importing" as const : item.status === "failed" ? "failed" as const : "queued" as const,
      size: item.size ? formatBytes(item.size) : "N/A",
      sizeLeft: item.sizeleft ? formatBytes(item.sizeleft) : "0 MB",
      eta: item.estimatedCompletionTime ? new Date(item.estimatedCompletionTime).toLocaleTimeString() : "N/A",
      service: serviceId,
    }));
  } catch {
    return [];
  }
}

export async function getActivity(serviceId: string): Promise<ActivityEvent[]> {
  if (isMock())
    return mockActivity.filter((a) => a.service === serviceId).slice(0, 200);

  try {
    let res: Response;

    if (serviceId === "prowlarr") {
      res = await arrFetch(serviceId, "/history?pageSize=2000");
      if (!res.ok) return [];
      const histData = await res.json();
      const records = (histData.records || []) as any[];

      const indexerRes = await arrFetch(serviceId, "/indexer");
      const indexerMap: Record<number, string> = {};
      if (indexerRes.ok) {
        const indexers = await indexerRes.json();
        for (const idx of indexers) {
          if (idx.id != null) indexerMap[idx.id] = idx.name;
        }
      }

      return records.map((item: any, i: number) => {
        const indexerName = item.indexerId != null ? (indexerMap[item.indexerId] || `ID#${item.indexerId}`) : "Unknown";
        const data = item.data || {};
        let type: "download" | "import" | "error" | "search" | "refresh" = "refresh";
        let title = item.eventType || "History event";
        let message = "";

        switch (item.eventType) {
          case "indexerRss":
            type = "refresh";
            title = `${indexerName} RSS`;
            message = `← ${data.source || "?"} (${data.queryType || "?"}, ${data.queryResults || 0} results)`;
            break;
          case "indexerQuery":
            type = "search";
            title = data.query || "Search";
            message = `→ ${indexerName} (${data.source || "?"}, ${data.queryResults || 0} results)`;
            break;
          case "releaseGrabbed":
            type = "download";
            title = data.grabTitle || "Release grabbed";
            message = `→ ${indexerName} via ${data.source || "?"}`;
            break;
        }

        return {
          id: i,
          service: serviceId,
          type,
          title,
          message,
          timestamp: item.date || new Date().toISOString(),
        };
      });
    } else if (serviceId === "bazarr") {
      res = await arrFetch(serviceId, "/system/logs?start=0&limit=2000");
    } else if (serviceId === "jellyseerr") {
      res = await arrFetch(serviceId, "/request?take=5000&skip=0&sort=added");
    } else {
      res = await arrFetch(serviceId, "/history?pageSize=2000");
    }

    if (!res.ok) return [];

    const data = await res.json();

    if (serviceId === "jellyseerr") {
      const items = data.results || data.items || [];
      const titleCache = new Map<number, string>();
      const statusLabels: Record<number, string> = {
        1: "Pending Approval",
        2: "Approved",
        3: "Declined",
        4: "Failed",
        5: "Fulfilled",
      };

      const resolveTitle = async (item: any): Promise<string> => {
        const tmdbId = item.media?.tmdbId;
        if (!tmdbId) return "Unknown";
        if (titleCache.has(tmdbId)) return titleCache.get(tmdbId)!;

        const serviceUrl = item.media?.serviceUrl || "";
        const seriesMatch = serviceUrl.match(/\/series\/([\w-]+)/);
        if (seriesMatch) {
          const title = seriesMatch[1].replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
          titleCache.set(tmdbId, title);
          return title;
        }

        if (item.media?.mediaType === "movie") {
          try {
            const res = await arrFetch("radarr", `/movie?tmdbId=${tmdbId}`);
            if (res.ok) {
              const movies = await res.json();
              const t = movies[0]?.title || `Movie #${tmdbId}`;
              titleCache.set(tmdbId, t);
              return t;
            }
          } catch {}
        }
        return `Movie #${tmdbId}`;
      };

      const resolved = await Promise.all(items.map(async (item: any) => ({
        item,
        mediaTitle: await resolveTitle(item),
        seasonInfo: item.season?.seasonNumber ? ` S${item.season.seasonNumber}` : "",
      })));

      return resolved.map(({ item, mediaTitle, seasonInfo }) => ({
        id: item.id,
        service: serviceId,
        type: item.status === 3 ? "error" as const : "request" as const,
        title: statusLabels[item.status] || "Request",
        message: `${mediaTitle}${seasonInfo} — requested by ${item.requestedBy?.displayName || "Unknown"}`,
        timestamp: item.createdAt || new Date().toISOString(),
      }));
    }

    if (serviceId === "bazarr") {
      return (data.data || []).map((item: any, i: number) => ({
        id: i,
        service: serviceId,
        type: item.action?.includes("download") ? "download" as const : "import" as const,
        title: item.action || "Subtitle action",
        message: item.message || item.title || "",
        timestamp: item.timestamp || new Date().toISOString(),
      }));
    }

    const events = (data.records || data || []) as any[];
    return events
      .map((item: any, i: number) => ({
      id: i,
      service: serviceId,
      type: item.eventType === "downloadFolderImported" ? "import" as const :
            item.eventType === "grabbed" ? "download" as const :
            item.eventType === "downloadFailed" ? "error" as const :
            item.eventType === "indexerSearch" ? "search" as const :
            "refresh" as const,
      title: item.eventType || "History event",
      message: item.data?.message || item.data?.title || "",
      timestamp: item.date || new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function getSystemInfo(serviceId: string): Promise<SystemInfo> {
  if (isMock()) {
    return { os: "Linux", version: "5.18.4.9568", docker: true, uptime: "3d 14h" };
  }

  if (serviceId === "prowlarr" || serviceId === "jellyseerr" || serviceId === "bazarr") {
    return { os: "unknown", version: "unknown", docker: false, uptime: "N/A" };
  }

  try {
    const res = await arrFetch(serviceId, "/system/status");
    if (!res.ok) return { os: "unknown", version: "unknown", docker: false, uptime: "N/A" };

    const data = await res.json();
    return {
      os: data.osName || data.platform || "unknown",
      version: data.version || "unknown",
      docker: data.isDocker || data.docker || false,
      uptime: data.uptime ? `${data.uptime}` : formatUptime(data.startTime),
    };
  } catch {
    return { os: "unknown", version: "unknown", docker: false, uptime: "N/A" };
  }
}

export function formatUptime(startTime?: string): string {
  if (!startTime) return "N/A";
  const start = new Date(startTime).getTime();
  const now = Date.now();
  const diff = now - start;
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  return `${hours}h ${Math.floor((diff % 3600000) / 60000)}m`;
}

export async function pauseQueue(serviceId: string): Promise<boolean> {
  if (isMock()) return true;

  try {
    const res = await arrFetch(serviceId, "/command", {
      method: "POST",
      body: JSON.stringify({ name: "PauseAllDownloadClients" }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function refreshMonitored(serviceId: string): Promise<boolean> {
  if (isMock()) return true;

  try {
    const res = await arrFetch(serviceId, "/command", {
      method: "POST",
      body: JSON.stringify({ name: "RefreshMonitoredDownloads" }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function searchMissing(serviceId: string): Promise<boolean> {
  if (isMock()) return true;

  try {
    const commandName = serviceId === "radarr" ? "MoviesSearch" : "SeriesSearch";
    const res = await arrFetch(serviceId, "/command", {
      method: "POST",
      body: JSON.stringify({ name: commandName }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
