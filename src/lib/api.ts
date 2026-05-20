import { services } from "./services";
import { getBasicAuth } from "./auth";
import type { HealthStatus, QueueItem, ActivityEvent, DiskSpace } from "./mock-data";
import { mockHealth, mockQueue, mockActivity } from "./mock-data";

const USE_MOCK = process.env.USE_MOCK_DATA === "true";

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

  const apiKey = process.env[service.apiKeyEnv];
  if (!apiKey) {
    throw new Error(`Missing API key for ${serviceId} (env: ${service.apiKeyEnv})`);
  }

  const url = `${baseUrl}${service.apiEndpoint}${endpoint}`;

  const maxRetries = 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(15000),
        headers: {
          "X-Api-Key": apiKey,
          Authorization: getBasicAuth(serviceId),
          "Content-Type": "application/json",
          ...options?.headers,
        },
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
  if (USE_MOCK) return mockHealth[serviceId];

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
  if (USE_MOCK) {
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

    const usedBytes = totalBytes - freeBytes;
    const percent = totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 100) : 0;

    return {
      used: formatBytes(usedBytes),
      total: formatBytes(totalBytes),
      percent,
      usedBytes,
      mounts: data.map(m => ({ path: m.path, used: formatBytes(m.totalSpace - m.freeSpace), total: formatBytes(m.totalSpace) })),
    };
  } catch {
    return { used: "0 MB", total: "N/A", percent: 0 };
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 MB";
  const gb = bytes / 1073741824;
  if (gb >= 1000) return `${(gb / 1000).toFixed(1)} TB`;
  return `${gb.toFixed(1)} GB`;
}

export async function getQueue(serviceId: string): Promise<QueueItem[]> {
  if (USE_MOCK) return mockQueue.filter((q) => q.service === serviceId);

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
      progress: item.status === "downloading" ? Math.round(((item.size - (item.sizeleft || 0)) / (item.size || 1)) * 100) : 0,
      status: item.status === "downloading" ? "downloading" as const : item.status === "importing" ? "importing" as const : "queued" as const,
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
  if (USE_MOCK)
    return mockActivity.filter((a) => a.service === serviceId).slice(0, 10);

  try {
    let res: Response;

    if (serviceId === "prowlarr") {
      res = await arrFetch(serviceId, "/history?pageSize=10");
    } else if (serviceId === "bazarr") {
      res = await arrFetch(serviceId, "/system/logs?start=0&limit=10");
    } else if (serviceId === "jellyseerr") {
      res = await arrFetch(serviceId, "/activity?take=10&skip=0&sort=createdAt");
    } else {
      res = await arrFetch(serviceId, "/history?pageSize=10");
    }

    if (!res.ok) return [];

    const data = await res.json();

    if (serviceId === "jellyseerr") {
      const items = data.results || data.items || [];
      return items.map((item: any, i: number) => {
        const activityType = item.activity || item.type || "";
        const media = item.media || item.request?.media || {};
        return {
          id: i,
          service: serviceId,
          type: "request" as const,
          title: activityType || "Activity",
          message: `${media?.title || media?.media?.title || "Unknown"} — ${activityType}`,
          timestamp: item.timestamp || item.createdAt || item.updatedAt || new Date().toISOString(),
        };
      });
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

    return (data.records || data || []).slice(0, 10).map((item: any, i: number) => ({
      id: i,
      service: serviceId,
      type: item.eventType === "downloadFolderImported" ? "import" as const :
            item.eventType === "grabbed" ? "download" as const :
            item.eventType === "downloadFailed" ? "error" as const :
            "refresh" as const,
      title: item.eventType || "History event",
      message: item.data?.message || item.data?.title || "",
      timestamp: item.date || new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

export interface SystemInfo {
  os: string;
  docker: boolean;
  uptime: string;
}

export async function getSystemInfo(serviceId: string): Promise<SystemInfo> {
  if (USE_MOCK) {
    return { os: "Linux", docker: true, uptime: "3d 14h" };
  }

  if (serviceId === "prowlarr" || serviceId === "jellyseerr" || serviceId === "bazarr") {
    return { os: "unknown", docker: false, uptime: "N/A" };
  }

  try {
    const res = await arrFetch(serviceId, "/system/status");
    if (!res.ok) return { os: "unknown", docker: false, uptime: "N/A" };

    const data = await res.json();
    return {
      os: data.osName || data.platform || "unknown",
      docker: data.isDocker || data.docker || false,
      uptime: data.uptime ? `${data.uptime}` : formatUptime(data.startTime),
    };
  } catch {
    return { os: "unknown", docker: false, uptime: "N/A" };
  }
}

function formatUptime(startTime?: string): string {
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
  if (USE_MOCK) return true;

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
  if (USE_MOCK) return true;

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
  if (USE_MOCK) return true;

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
