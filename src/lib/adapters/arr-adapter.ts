import type { ServiceAdapter, QuerySpec, QueryResult } from "./types";
import { arrFetch } from "./fetch";
import { formatBytes } from "../format";
import type { HealthStatus, QueueItem, ActivityEvent, DiskSpace, SystemInfo } from "../types";

export class ArrAdapter implements ServiceAdapter {
  readonly id: string;
  readonly capabilities = new Set<keyof QuerySpec>(["health", "queue", "disk", "activity", "system"]);

  constructor(id: string) {
    this.id = id;
  }

  async query(spec: QuerySpec): Promise<QueryResult> {
    const result: QueryResult = {};
    if (spec.health || spec.system) {
      const ss = await this._fetchSystemStatus();
      if (spec.health) result.health = ss.health;
      if (spec.system) result.system = ss.info;
    }
    if (spec.queue) result.queue = await this._fetchQueue();
    if (spec.disk) result.disk = await this._fetchDiskSpace();
    if (spec.activity) result.activity = await this._fetchActivity();
    return result;
  }

  async command(action: string): Promise<{ success: boolean; error?: string }> {
    try {
      const commandNames: Record<string, string> = {
        pause: "PauseAllDownloadClients",
        refresh: "RefreshMonitoredDownloads",
        search: this.id === "radarr" ? "MoviesSearch" : "SeriesSearch",
      };
      const name = commandNames[action];
      if (!name) return { success: false, error: `Unknown action: ${action}` };
      const res = await arrFetch(this.id, "/command", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      return { success: res.ok };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  private async _fetchSystemStatus(): Promise<{ health: HealthStatus; info: SystemInfo }> {
    const start = Date.now();
    try {
      const res = await arrFetch(this.id, "/system/status");
      if (!res.ok) {
        return {
          health: { status: "error" as const, message: `HTTP ${res.status}: ${res.statusText}`, version: "unknown", responseTime: Date.now() - start },
          info: { os: "unknown", version: "unknown", docker: false, uptime: "N/A" },
        };
      }
      const data = await res.json();
      return {
        health: { status: "healthy" as const, message: "All systems operational", version: data.version || "unknown", responseTime: Date.now() - start },
        info: {
          os: data.osName || data.platform || "unknown",
          version: data.version || "unknown",
          docker: data.isDocker || data.docker || false,
          uptime: data.uptime ? `${data.uptime}` : "",
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Connection failed";
      return {
        health: { status: "error" as const, message: message.includes("timed out") ? "Request timed out" : `Fetch error: ${message}`, version: "unknown", responseTime: 0 },
        info: { os: "unknown", version: "unknown", docker: false, uptime: "N/A" },
      };
    }
  }

  private async _fetchQueue(): Promise<QueueItem[]> {
    try {
      const res = await arrFetch(this.id, "/queue?includeUnknownMovieItems=true&includeUnknownSeriesItems=true");
      if (!res.ok) return [];
      const data = await res.json();
      return (data.records || data || []).map((item: any) => ({
        id: item.id,
        title: item.movie?.title || item.series?.title || item.title || "Unknown",
        progress: item.status === "downloading" ? Math.round(((item.size - (item.sizeleft || 0)) / (item.size || 1)) * 100) : 0,
        status: item.status === "downloading" ? "downloading" as const : item.status === "importing" ? "importing" as const : item.status === "failed" ? "failed" as const : "queued" as const,
        size: item.size ? formatBytes(item.size) : "N/A",
        sizeLeft: item.sizeleft ? formatBytes(item.sizeleft) : "0 MB",
        eta: item.estimatedCompletionTime ? new Date(item.estimatedCompletionTime).toLocaleTimeString() : "N/A",
        service: this.id,
      }));
    } catch {
      return [];
    }
  }

  private async _fetchDiskSpace(): Promise<DiskSpace> {
    try {
      const res = await arrFetch(this.id, `/diskspace?t=${Date.now()}`);
      if (!res.ok) return { used: "0 MB", total: "N/A", percent: 0 };
      const data: Array<{ path: string; freeSpace: number; totalSpace: number }> = await res.json();
      if (!Array.isArray(data) || data.length === 0) return { used: "0 MB", total: "N/A", percent: 0 };

      const uniqueDisks = new Map<string, { freeSpace: number; totalSpace: number }>();
      for (const mount of data) {
        if (!uniqueDisks.has(mount.path)) uniqueDisks.set(mount.path, { freeSpace: mount.freeSpace, totalSpace: mount.totalSpace });
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
        totalBytes,
        path: data.map(m => m.path).sort().join("|"),
        mounts: data.map(m => ({ path: m.path, used: formatBytes(m.totalSpace - m.freeSpace), total: formatBytes(m.totalSpace) })),
      };
    } catch {
      return { used: "0 MB", total: "N/A", percent: 0 };
    }
  }

  private async _fetchActivity(): Promise<ActivityEvent[]> {
    try {
      const res = await arrFetch(this.id, "/history?pageSize=10");
      if (!res.ok) return [];
      const data = await res.json();
      return (data.records || data || [])
        .filter((item: any) => !["indexerRss", "indexerSearch"].includes(item.eventType))
        .slice(0, 10)
        .map((item: any, i: number) => ({
          id: i,
          service: this.id,
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
}
