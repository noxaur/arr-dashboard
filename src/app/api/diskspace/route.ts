import { NextResponse } from "next/server";
import { getDiskSpace, formatBytes } from "@/lib/api";

export async function GET() {
  try {
    const [radarr, sonarr] = await Promise.all([
      getDiskSpace("radarr"),
      getDiskSpace("sonarr"),
    ]);

    const parseBytes = (value: string | number): number => {
      if (typeof value === "number") return Number.isFinite(value) ? value : 0;
      const match = value.match(/^([\d.]+)\s*(B|KB|MB|GB|TB)$/i);
      if (!match) return 0;
      const num = parseFloat(match[1]);
      if (isNaN(num)) return 0;
      const unit = match[2].toUpperCase();
      const multipliers: Record<string, number> = {
        B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776,
      };
      return Math.round(num * (multipliers[unit] || 1));
    };

    // Deduplicate by total bytes — Radarr and Sonarr report the same underlying disk
    const seenTotals = new Set<number>();
    let totalBytes = 0;
    let usedBytes = 0;

    for (const disk of [radarr, sonarr]) {
      if (disk.total !== "N/A") {
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
      radarr,
      sonarr,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch disk space" },
      { status: 500 }
    );
  }
}
