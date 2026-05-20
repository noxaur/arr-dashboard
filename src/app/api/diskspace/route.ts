import { NextResponse } from "next/server";
import { getDiskSpace } from "@/lib/api";

export async function GET() {
  try {
    const [radarr, sonarr] = await Promise.all([
      getDiskSpace("radarr"),
      getDiskSpace("sonarr"),
    ]);

    let totalBytes = 0;
    let usedBytes = 0;

    const parseBytes = (value: string): number => {
      const num = parseFloat(value);
      if (value.includes("TB")) return num * 1073741824 * 1000;
      if (value.includes("GB")) return num * 1073741824;
      if (value.includes("MB")) return num * 1048576;
      return 0;
    };

    for (const disk of [radarr, sonarr]) {
      if (disk.total !== "N/A") {
        totalBytes += parseBytes(disk.total);
        usedBytes += parseBytes(disk.used);
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

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 MB";
  const gb = bytes / 1073741824;
  if (gb >= 1000) return `${(gb / 1000).toFixed(1)} TB`;
  return `${gb.toFixed(1)} GB`;
}
