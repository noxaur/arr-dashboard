import { services } from "./services";
import type { HealthStatus, QueueItem, ActivityEvent, DiskSpace } from "./mock-data";
import { mockHealth, mockQueue, mockActivity } from "./mock-data";

const USE_MOCK = process.env.USE_MOCK_DATA === "true";

const BASIC_USER = process.env.ARR_BASIC_USER || "";
const BASIC_PASS = process.env.ARR_BASIC_PASS || "";
const basicAuth = `Basic ${Buffer.from(`${BASIC_USER}:${BASIC_PASS}`).toString("base64")}`;

async function arrFetch(
  serviceId: string,
  endpoint: string,
  options?: RequestInit
): Promise<Response> {
  const service = services[serviceId];
  if (!service) throw new Error(`Unknown service: ${serviceId}`);

  const baseUrl = service.url.replace(/\/$/, "");
  const url = `${baseUrl}${service.apiEndpoint}${endpoint}`;

  return fetch(url, {
    ...options,
    headers: {
      "X-Api-Key": process.env[service.apiKeyEnv] || "",
      Authorization: basicAuth,
      "Content-Type": "application/json",
      ...options?.headers,
    },
    cache: "no-store",
  });
}

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
    return {
      status: "offline",
      message: error instanceof Error ? error.message : "Connection failed",
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
    const res = await arrFetch(serviceId, "/system/status");
    if (!res.ok) return { used: "0 MB", total: "N/A", percent: 0 };

    const data = await res.json();

    if (data.diskSpace) {
      const total = data.diskSpace[0]?.totalBytes || 0;
      const free = data.diskSpace[0]?.freeSpace || 0;
      const used = total - free;
      const percent = total > 0 ? Math.round((used / total) * 100) : 0;
      return {
        used: formatBytes(used),
        total: formatBytes(total),
        percent,
      };
    }

    return { used: "0 MB", total: "N/A", percent: 0 };
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
      res = await arrFetch(serviceId, "/request?take=10&skip=0&sort=modified&includeAll=true");
    } else {
      res = await arrFetch(serviceId, "/history?pageSize=10");
    }

    if (!res.ok) return [];

    const data = await res.json();

    if (serviceId === "jellyseerr") {
      return (data.results || []).map((item: any, i: number) => ({
        id: i,
        service: serviceId,
        type: "request" as const,
        title: item.status === 2 ? "Request approved" : item.status === 3 ? "Request available" : "New request",
        message: `${item.media?.title || "Unknown"} — ${item.status === 2 ? "approved" : item.status === 3 ? "available" : "pending"}`,
        timestamp: item.updatedAt || item.createdAt || new Date().toISOString(),
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

export async function pauseQueue(serviceId: string): Promise<boolean> {
  if (USE_MOCK) return true;

  try {
    const res = await arrFetch(serviceId, "/config/downloadclient", {
      method: "PUT",
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
