import { describe, it, expect } from "vitest";
import { groupEvents, formatTime, type ActivityEvent } from "./events";

describe("formatTime", () => {
  it("returns 'just now' for current time (within 1 minute)", () => {
    const now = Date.now();
    const iso = new Date(now).toISOString();
    expect(formatTime(iso, now)).toBe("just now");
  });

  it("returns 'just now' for future dates (negative diff)", () => {
    const now = Date.now();
    const future = new Date(now + 60000).toISOString();
    expect(formatTime(future, now)).toBe("just now");
  });

  it("returns '5m ago' for 5 minutes ago", () => {
    const now = Date.now();
    const past = new Date(now - 5 * 60000).toISOString();
    expect(formatTime(past, now)).toBe("5m ago");
  });

  it("returns '2h ago' for 2 hours ago", () => {
    const now = Date.now();
    const past = new Date(now - 2 * 3600000).toISOString();
    expect(formatTime(past, now)).toBe("2h ago");
  });

  it("returns a date string for >24h ago", () => {
    const now = Date.now();
    const past = new Date(now - 25 * 3600000).toISOString();
    const result = formatTime(past, now);
    expect(result).not.toBe("just now");
    expect(result).not.toMatch(/^\d+[mh] ago$/);
  });

  it("accepts optional now parameter for deterministic testing", () => {
    const iso = "2024-01-15T12:00:00Z";
    expect(formatTime(iso, 1705312800000)).toBe("just now");
  });
});

describe("groupEvents", () => {
  const makeEvent = (overrides: Partial<ActivityEvent>): ActivityEvent => ({
    id: 1,
    service: "radarr",
    type: "download",
    title: "Movie (2024)",
    message: "Downloaded Movie",
    timestamp: "2024-01-15T12:00:00Z",
    ...overrides,
  });

  it("returns empty array for empty input", () => {
    expect(groupEvents([])).toEqual([]);
  });

  it("returns single group for single event", () => {
    const event = makeEvent({ id: 1 });
    const result = groupEvents([event]);
    expect(result).toHaveLength(1);
    expect(result[0].count).toBe(1);
    expect(result[0].events).toEqual([event]);
  });

  it("groups consecutive events with same service+type+title", () => {
    const events = [
      makeEvent({ id: 1 }),
      makeEvent({ id: 2 }),
      makeEvent({ id: 3 }),
    ];
    const result = groupEvents(events);
    expect(result).toHaveLength(1);
    expect(result[0].count).toBe(3);
  });

  it("does NOT group events with different services", () => {
    const events = [
      makeEvent({ id: 1, service: "radarr" }),
      makeEvent({ id: 2, service: "sonarr" }),
    ];
    const result = groupEvents(events);
    expect(result).toHaveLength(2);
  });

  it("does NOT group events with different types", () => {
    const events = [
      makeEvent({ id: 1, type: "download" }),
      makeEvent({ id: 2, type: "import" }),
    ];
    const result = groupEvents(events);
    expect(result).toHaveLength(2);
  });

  it("does NOT group events with different titles", () => {
    const events = [
      makeEvent({ id: 1, title: "Movie A (2024)" }),
      makeEvent({ id: 2, title: "Movie B (2024)" }),
    ];
    const result = groupEvents(events);
    expect(result).toHaveLength(2);
  });

  it("creates separate groups for sequential groups of different events", () => {
    const events = [
      makeEvent({ id: 1, title: "Movie A" }),
      makeEvent({ id: 2, title: "Movie A" }),
      makeEvent({ id: 3, title: "Movie B" }),
      makeEvent({ id: 4, title: "Movie B" }),
    ];
    const result = groupEvents(events);
    expect(result).toHaveLength(2);
    expect(result[0].count).toBe(2);
    expect(result[1].count).toBe(2);
  });

  it("handles alternating pattern (A, B, A) correctly — should create 3 groups", () => {
    const events = [
      makeEvent({ id: 1, title: "Movie A" }),
      makeEvent({ id: 2, title: "Movie B" }),
      makeEvent({ id: 3, title: "Movie A" }),
    ];
    const result = groupEvents(events);
    expect(result).toHaveLength(3);
    expect(result[0].events[0].title).toBe("Movie A");
    expect(result[1].events[0].title).toBe("Movie B");
    expect(result[2].events[0].title).toBe("Movie A");
  });
});
