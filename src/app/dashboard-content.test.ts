import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatTime } from "@/lib/time";

describe("formatTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-22T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'just now' for negative diff (clock skew)", () => {
    const future = new Date("2026-05-22T12:00:30Z").toISOString();
    expect(formatTime(future)).toBe("just now");
  });

  it("returns 'just now' for 0 diff", () => {
    expect(formatTime(new Date("2026-05-22T12:00:00Z").toISOString())).toBe("just now");
  });

  it("returns 'just now' for less than 1 minute", () => {
    expect(formatTime(new Date("2026-05-22T11:59:45Z").toISOString())).toBe("just now");
  });

  it("returns 'Xm ago' for minutes", () => {
    expect(formatTime(new Date("2026-05-22T11:55:00Z").toISOString())).toBe("5m ago");
  });

  it("returns 'Xh ago' for hours", () => {
    expect(formatTime(new Date("2026-05-22T09:00:00Z").toISOString())).toBe("3h ago");
  });

  it("returns locale date for >= 24 hours", () => {
    expect(formatTime(new Date("2026-05-20T12:00:00Z").toISOString())).toBe("5/20/2026");
  });
});
