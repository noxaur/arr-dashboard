import type { ServiceAdapter, QuerySpec, QueryResult } from "./types";
import { arrFetch } from "./fetch";
import type { HealthStatus, SystemInfo } from "../types";

export class ProwlarrAdapter implements ServiceAdapter {
  readonly id = "prowlarr";
  readonly capabilities = new Set<keyof QuerySpec>(["health", "activity", "system"]);

  async query(spec: QuerySpec): Promise<QueryResult> {
    const result: QueryResult = {};
    if (spec.health || spec.system) {
      const ss = await this._fetchSystemStatus();
      if (spec.health) result.health = ss.health;
      if (spec.system) result.system = ss.info;
    }
    if (spec.queue) result.queue = [];
    if (spec.disk) result.disk = { used: "0 MB", total: "N/A", percent: 0 };
    if (spec.activity) result.activity = await this._fetchActivity();
    return result;
  }

  async command(_action: string): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: "Commands not supported for Prowlarr" };
  }

  private async _fetchSystemStatus(): Promise<{ health: HealthStatus; info: SystemInfo }> {
    const start = Date.now();
    try {
      const res = await arrFetch(this.id, "/system/status");
      if (!res.ok) return { health: { status: "error" as const, message: `HTTP ${res.status}`, version: "unknown", responseTime: Date.now() - start }, info: { os: "unknown", version: "unknown", docker: false, uptime: "N/A" } };
      const data = await res.json();
      return {
        health: { status: "warning" as const, message: data.warning || "All systems operational", version: data.version || "unknown", responseTime: Date.now() - start },
        info: { os: data.osName || data.platform || "unknown", version: data.version || "unknown", docker: data.isDocker || false, uptime: data.uptime || "" },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Connection failed";
      return { health: { status: "error" as const, message: message.includes("timed out") ? "Request timed out" : `Fetch error: ${message}`, version: "unknown", responseTime: 0 }, info: { os: "unknown", version: "unknown", docker: false, uptime: "N/A" } };
    }
  }

  private async _fetchActivity(): Promise<any[]> {
    try {
      const res = await arrFetch(this.id, "/history?pageSize=10");
      if (!res.ok) return [];
      const data = await res.json();
      return (data.records || data || []).slice(0, 10).map((item: any, i: number) => ({
        id: i,
        service: this.id,
        type: "error" as const,
        title: item.eventType || "History event",
        message: item.data?.message || item.data?.title || "",
        timestamp: item.date || new Date().toISOString(),
      }));
    } catch {
      return [];
    }
  }
}
