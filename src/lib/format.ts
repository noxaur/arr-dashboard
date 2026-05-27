export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let unitIndex = 0;
  let value = bytes;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[unitIndex]}`;
}

export function parseBytes(value: string | number): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const match = value.match(/^([\d.]+)\s*(B|KB|MB|GB|TB)$/i);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  if (isNaN(num)) return 0;
  const unit = match[2].toUpperCase();
  const multipliers: Record<string, number> = { B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776 };
  return Math.round(num * (multipliers[unit] || 1));
}
