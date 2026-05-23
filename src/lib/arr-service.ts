import { serviceOrder } from "./services";
import { getAdapter } from "./adapters/registry";
import type { ServiceAdapter, QuerySpec, QueryResult } from "./adapters/types";
import type { DashboardResponse, DashboardServiceData } from "./types";
import { getJellyfinSystemInfo, getJellyfinSessions } from "./jellyfin";

export async function fetchAllServices<T>(
  category: keyof QuerySpec,
  options?: { services?: string[] }
): Promise<Record<string, T>> {
  const ids = options?.services ?? serviceOrder;
  const results = await Promise.allSettled(
    ids.map(async (id) => getAdapter(id).query({ [category]: true }))
  );

  const entries: Record<string, T> = {};
  for (let i = 0; i < ids.length; i++) {
    const r = results[i];
    if (r.status === "fulfilled") {
      const data = (r.value as QueryResult)[category] as T | undefined;
      if (data !== undefined) entries[ids[i]] = data;
    }
  }
  return entries;
}

export async function getDashboardData(): Promise<DashboardResponse> {
  const allSpec: QuerySpec = { health: true, queue: true, disk: true, activity: true, system: true };

  const results = await Promise.allSettled(
    serviceOrder.map(async (id) => getAdapter(id).query(allSpec))
  );

  const services: DashboardServiceData[] = serviceOrder.map((id, i) => {
    const r = results[i].status === "fulfilled" ? results[i].value : null;
    if (r) {
      return {
        id,
        health: r.health ?? { status: "error", message: "Health check failed", version: "unknown", responseTime: 0 },
        queue: r.queue ?? [],
        disk: r.disk ?? { used: "0 MB", total: "N/A", percent: 0 },
        activity: r.activity ?? [],
        system: r.system ?? { os: "unknown", version: "unknown", docker: false, uptime: "N/A" },
      };
    }
    return {
      id,
      health: { status: "error", message: "Health check failed", version: "unknown", responseTime: 0 },
      queue: [],
      disk: { used: "0 MB", total: "N/A", percent: 0 },
      activity: [],
      system: { os: "unknown", version: "unknown", docker: false, uptime: "N/A" },
    };
  });

  const [jellyfinInfo, activeStreams] = await Promise.all([
    getJellyfinSystemInfo().catch(() => null),
    getJellyfinSessions().catch(() => 0),
  ]);

  const totalQueue = services.flatMap((s) => s.queue).length;
  const activeDownloads = services.flatMap((s) => s.queue).filter((q) => q.status === "downloading").length;
  const healthAlerts = services.filter((s) => s.health.status === "warning" || s.health.status === "error").length;
  const seenDiskTotals = new Set<number>();
  let totalDiskUsed = 0;
  let totalDiskSize = 0;
  for (const s of services) {
    if (s.disk?.totalBytes != null && !seenDiskTotals.has(s.disk.totalBytes)) {
      seenDiskTotals.add(s.disk.totalBytes);
      totalDiskUsed += s.disk.usedBytes ?? 0;
      totalDiskSize += s.disk.totalBytes;
    }
  }

  const allActivity = services
    .flatMap((s) => s.activity.map((e) => ({ ...e, service: s.id })))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 15);

  return {
    services,
    jellyfin: jellyfinInfo,
    activeStreams,
    totalQueue,
    activeDownloads,
    healthAlerts,
    totalDiskUsed,
    totalDiskSize,
    allActivity,
  };
}
