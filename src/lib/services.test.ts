import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("services URL configuration", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns configured URLs from env vars", async () => {
    vi.stubEnv("RADARR_URL", "http://radarr:7878");
    vi.stubEnv("SONARR_URL", "http://sonarr:8989");
    vi.stubEnv("PROWLARR_URL", "http://prowlarr:9696");
    vi.stubEnv("BAZARR_URL", "http://bazarr:6767");
    vi.stubEnv("JELLYSEERR_URL", "http://jellyseerr:5055");

    const { services } = await import("./services");
    expect(services.radarr.url).toBe("http://radarr:7878");
    expect(services.sonarr.url).toBe("http://sonarr:8989");
    expect(services.prowlarr.url).toBe("http://prowlarr:9696");
    expect(services.bazarr.url).toBe("http://bazarr:6767");
    expect(services.jellyseerr.url).toBe("http://jellyseerr:5055");
  });

  it("returns empty URL when env var is not set", async () => {
    vi.stubEnv("RADARR_URL", "");
    const { services } = await import("./services");
    expect(services.radarr.url).toBe("");
  });

  it("serviceOrder includes all expected services", async () => {
    const { serviceOrder } = await import("./services");
    expect(serviceOrder).toEqual(["radarr", "sonarr", "prowlarr", "bazarr", "jellyseerr"]);
  });
});
