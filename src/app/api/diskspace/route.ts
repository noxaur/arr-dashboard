import { NextResponse } from "next/server";
import { formatBytes } from "@/lib/format";
import { fetchAllServices } from "@/lib/arr-service";
import type { DiskSpace } from "@/lib/types";

export async function GET() {
  try {
    const entries = await fetchAllServices<DiskSpace>("disk");

    // Deduplicate by path — Radarr and Sonarr report the same underlying disk
    const seenPaths = new Set<string>();
    let totalBytes = 0;
    let usedBytes = 0;

    for (const disk of Object.values(entries)) {
      if (disk.path !== undefined && !seenPaths.has(disk.path)) {
        seenPaths.add(disk.path);
        totalBytes += disk.totalBytes ?? 0;
        usedBytes += disk.usedBytes ?? 0;
      }
    }

    const percent = totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 100) : 0;

    return NextResponse.json({
      used: formatBytes(usedBytes),
      total: formatBytes(totalBytes),
      percent,
      ...entries,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch disk space" }, { status: 500 });
  }
}
