import { NextResponse } from "next/server";
import { serviceOrder } from "@/lib/services";
import { checkHealth, getQueue, getActivity, getDiskSpace, getSystemInfo } from "@/lib/api";
import { getJellyfinSystemInfo, getJellyfinSessions } from "@/lib/jellyfin";

export async function GET() {
  const [healthResults, queueResults, diskResults, activityResults, systemResults, jellyfinInfo, activeStreams] = await Promise.all([
    Promise.allSettled(serviceOrder.map((id) => checkHealth(id))),
    Promise.allSettled(serviceOrder.map((id) => getQueue(id))),
    Promise.allSettled(serviceOrder.map((id) => getDiskSpace(id))),
    Promise.allSettled(serviceOrder.map((id) => getActivity(id))),
    Promise.allSettled(serviceOrder.map((id) => getSystemInfo(id))),
    getJellyfinSystemInfo().catch(() => null),
    getJellyfinSessions().catch(() => 0),
  ]);

  const services = serviceOrder.map((id, i) => ({
    id,
    health: healthResults[i].status === "fulfilled" ? healthResults[i].value : { status: "error", message: "Health check failed", version: "unknown", responseTime: 0 },
    queue: queueResults[i].status === "fulfilled" ? queueResults[i].value : [],
    disk: diskResults[i].status === "fulfilled" ? diskResults[i].value : { used: "0 MB", total: "N/A", percent: 0 },
    activity: activityResults[i].status === "fulfilled" ? activityResults[i].value : [],
    system: systemResults[i].status === "fulfilled" ? systemResults[i].value : { os: "unknown", version: "unknown", docker: false, uptime: "N/A" },
  }));

  const totalQueue = services.flatMap((s) => s.queue).length;
  const activeDownloads = services.flatMap((s) => s.queue).filter((q: any) => q.status === "downloading").length;
  const healthAlerts = services.filter((s) => s.health.status === "warning" || s.health.status === "error").length;
  const totalDiskUsed = services.reduce((sum, s) => sum + (s.disk?.usedBytes || 0), 0);

  const allActivity = services
    .flatMap((s) => s.activity.map((e: any) => ({ ...e, service: s.id })))
    .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 15);

  return NextResponse.json({
    services,
    jellyfin: jellyfinInfo,
    activeStreams,
    totalQueue,
    activeDownloads,
    healthAlerts,
    totalDiskUsed,
    allActivity,
  });
}
