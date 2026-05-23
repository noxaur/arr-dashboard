import { NextResponse } from "next/server";
import { formatBytes, parseBytes } from "@/lib/format";
import { fetchAllServices } from "@/lib/arr-service";
import type { DiskSpace } from "@/lib/types";

export async function GET() {
  try {
    const entries = await fetchAllServices<DiskSpace>("disk");

    // Deduplicate by total bytes — Radarr and Sonarr report the same underlying disk
    const seenTotals = new Set<number>();
    let totalBytes = 0;
    let usedBytes = 0;

    for (const disk of Object.values(entries)) {
      if (disk.usedBytes !== undefined) {
        const diskTotal = parseBytes(disk.total);
        if (!seenTotals.has(diskTotal)) {
          seenTotals.add(diskTotal);
          totalBytes += diskTotal;
          usedBytes += parseBytes(disk.used);
        }
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
