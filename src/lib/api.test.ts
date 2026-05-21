import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatBytes, getDiskSpace } from "./api";

vi.mock("./services", () => ({
  services: {
    radarr: { id: "radarr", url: "http://radarr:7878", apiKeyEnv: "RADARR_API_KEY", apiEndpoint: "/api/v3" },
    sonarr: { id: "sonarr", url: "http://sonarr:8989", apiKeyEnv: "SONARR_API_KEY", apiEndpoint: "/api/v3" },
    prowlarr: { id: "prowlarr", url: "http://prowlarr:9696", apiKeyEnv: "PROWLARR_API_KEY", apiEndpoint: "/api/v1" },
    bazarr: { id: "bazarr", url: "http://bazarr:6767", apiKeyEnv: "BAZARR_API_KEY", apiEndpoint: "/api" },
    jellyseerr: { id: "jellyseerr", url: "http://jellyseerr:5055", apiKeyEnv: "JELLYSEERR_API_KEY", apiEndpoint: "/api/v1" },
  },
}));

vi.mock("./auth", () => ({
  getBasicAuth: () => "",
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("formatBytes", () => {
  it("formats zero bytes", () => {
    expect(formatBytes(0)).toBe("0 MB");
  });

  it("formats bytes to GB", () => {
    expect(formatBytes(1073741824)).toBe("1.0 GB");
    expect(formatBytes(5368709120)).toBe("5.0 GB");
  });

  it("formats bytes to TB", () => {
    expect(formatBytes(1099511627776)).toBe("1.0 TB");
    expect(formatBytes(8796093022208)).toBe("8.2 TB");
  });

  it("handles boundary values", () => {
    expect(formatBytes(1073741824000 - 1)).toBe("1000.0 GB");
    expect(formatBytes(1073741824000)).toBe("1.0 TB");
  });
});

describe("getDiskSpace", () => {
  beforeEach(() => {
    vi.stubEnv("USE_MOCK_DATA", "false");
    vi.stubEnv("RADARR_API_KEY", "test-key");
    vi.stubEnv("SONARR_API_KEY", "test-key");
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns N/A for Prowlarr", async () => {
    const result = await getDiskSpace("prowlarr");
    expect(result).toEqual({ used: "0 MB", total: "N/A", percent: 0 });
  });

  it("returns N/A for Jellyseerr", async () => {
    const result = await getDiskSpace("jellyseerr");
    expect(result).toEqual({ used: "0 MB", total: "N/A", percent: 0 });
  });

  it("returns N/A for Bazarr", async () => {
    const result = await getDiskSpace("bazarr");
    expect(result).toEqual({ used: "0 MB", total: "N/A", percent: 0 });
  });

  it("handles empty disk response", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });

    const result = await getDiskSpace("radarr");
    expect(result).toEqual({ used: "0 MB", total: "N/A", percent: 0 });
  });

  it("handles single disk correctly", async () => {
    const totalSpace = 8000000000000;
    const freeSpace = 5000000000000;

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ path: "/data", totalSpace, freeSpace }]),
    });

    const result = await getDiskSpace("radarr");
    expect(result.total).toBe("7.5 TB");
    expect(result.percent).toBe(38);
  });

  it("counts disks with different paths separately (even with same totalSpace)", async () => {
    const totalSpace = 8000000000000;
    const freeSpace1 = 5000000000000;
    const freeSpace2 = 6000000000000;

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        { path: "/movies", totalSpace, freeSpace: freeSpace1 },
        { path: "/movies4k", totalSpace, freeSpace: freeSpace2 },
      ]),
    });

    const result = await getDiskSpace("radarr");
    expect(result.total).toBe("14.9 TB");
    expect(result.percent).toBe(31);
  });

  it("counts multiple different disks", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        { path: "/data1", totalSpace: 4000000000000, freeSpace: 2000000000000 },
        { path: "/data2", totalSpace: 8000000000000, freeSpace: 5000000000000 },
      ]),
    });

    const result = await getDiskSpace("radarr");
    expect(result.total).toBe("11.2 TB");
    expect(result.percent).toBe(42);
  });

  it("handles API failure gracefully", async () => {
    mockFetch.mockResolvedValue({ ok: false });

    const result = await getDiskSpace("radarr");
    expect(result).toEqual({ used: "0 MB", total: "N/A", percent: 0 });
  });
});
