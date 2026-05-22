import type { ServiceAdapter, QuerySpec, QueryResult } from "./types";
import { arrFetch } from "./fetch";
import type { HealthStatus, QueueItem, DiskSpace, SystemInfo } from "../types";

export class JellyseerrAdapter implements ServiceAdapter {
  readonly id = "jellyseerr";
  readonly capabilities = new Set<keyof QuerySpec>(["health", "queue", "activity"]);

  async query(spec: QuerySpec): Promise<QueryResult> {
    const result: QueryResult = {};
    if (spec.health) result.health = await this._fetchHealth();
    if (spec.queue) result.queue = await this._fetchQueue();
    if (spec.activity) result.activity = await this._fetchActivity();
    if (spec.disk) result.disk = { used: "0 MB", total: "N/A", percent: 0 } as DiskSpace;
    if (spec.system) result.system = { os: "unknown", version: "unknown", docker: false, uptime: "N/A" } as SystemInfo;
    return result;
  }

  async command(_action: string): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: "Commands not supported for Jellyseerr" };
  }

  private async _fetchHealth(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      const res = await arrFetch(this.id, "/settings/main");
      if (!res.ok) return { status: "error" as const, message: `HTTP ${res.status}`, version: "unknown", responseTime: Date.now() - start };
      const data = await res.json();
      return {
        status: data.apiKey ? "healthy" as const : "warning" as const,
        message: data.apiKey ? "All systems operational" : "API key not configured",
        version: data.version || "unknown",
        responseTime: Date.now() - start,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Connection failed";
      return { status: "error" as const, message: message.includes("timed out") ? "Request timed out" : `Fetch error: ${message}`, version: "unknown", responseTime: 0 };
    }
  }

  private async _fetchQueue(): Promise<QueueItem[]> {
    try {
      const res = await arrFetch(this.id, "/request?take=20&skip=0&sort=added&filter=processing&includeAll=false");
      if (!res.ok) return [];
      const data = await res.json();
      return (data.results || []).map((item: any, i: number) => ({
        id: i,
        title: item.media?.title || "Unknown",
        progress: 0,
        status: "queued" as const,
        size: "N/A",
        sizeLeft: "N/A",
        eta: "N/A",
        service: this.id,
      }));
    } catch {
      return [];
    }
  }

  private async _fetchActivity(): Promise<any[]> {
    try {
      const res = await arrFetch(this.id, "/activity?take=10&skip=0&sort=createdAt");
      if (!res.ok) return [];
      const data = await res.json();
      const items = data.results || data.items || [];
      return items.map((item: any, i: number) => {
        const activityType = item.activity || item.type || "";
        const media = item.media || item.request?.media || {};
        return {
          id: i,
          service: this.id,
          type: "request" as const,
          title: activityType || "Activity",
          message: `${media?.title || media?.media?.title || "Unknown"} — ${activityType}`,
          timestamp: item.timestamp || item.createdAt || item.updatedAt || new Date().toISOString(),
        };
      });
    } catch {
      return [];
    }
  }
}
