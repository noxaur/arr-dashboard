import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getBasicAuth, getBasicCredentials } from "./auth";

describe("getBasicAuth", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("BASIC_USER_RADARR", undefined as any);
    vi.stubEnv("BASIC_PASS_RADARR", undefined as any);
    vi.stubEnv("ARR_BASIC_USER", undefined as any);
    vi.stubEnv("ARR_BASIC_PASS", undefined as any);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns Basic auth header with per-service credentials", () => {
    process.env.BASIC_USER_RADARR = "radarr-user";
    process.env.BASIC_PASS_RADARR = "radarr-pass";

    const result = getBasicAuth("radarr");
    expect(result).not.toBeNull();
    const decoded = Buffer.from(result!.replace("Basic ", ""), "base64").toString();
    expect(decoded).toBe("radarr-user:radarr-pass");
  });

  it("falls back to global credentials when per-service not set", () => {
    process.env.ARR_BASIC_USER = "global-user";
    process.env.ARR_BASIC_PASS = "global-pass";

    const result = getBasicAuth("sonarr");
    expect(result).not.toBeNull();
    const decoded = Buffer.from(result!.replace("Basic ", ""), "base64").toString();
    expect(decoded).toBe("global-user:global-pass");
  });

  it("per-service credentials take precedence over global", () => {
    process.env.BASIC_USER_RADARR = "radarr-user";
    process.env.BASIC_PASS_RADARR = "radarr-pass";
    process.env.ARR_BASIC_USER = "global-user";
    process.env.ARR_BASIC_PASS = "global-pass";

    const result = getBasicAuth("radarr");
    expect(result).not.toBeNull();
    const decoded = Buffer.from(result!.replace("Basic ", ""), "base64").toString();
    expect(decoded).toBe("radarr-user:radarr-pass");
  });

  it("returns null when no credentials are configured", () => {
    const result = getBasicAuth("bazarr");
    expect(result).toBeNull();
  });
});

describe("getBasicCredentials", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("BASIC_USER_SONARR", undefined as any);
    vi.stubEnv("BASIC_PASS_SONARR", undefined as any);
    vi.stubEnv("ARR_BASIC_USER", undefined as any);
    vi.stubEnv("ARR_BASIC_PASS", undefined as any);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns per-service credentials", () => {
    process.env.BASIC_USER_SONARR = "sonarr-user";
    process.env.BASIC_PASS_SONARR = "sonarr-pass";

    const result = getBasicCredentials("sonarr");
    expect(result).toEqual({ user: "sonarr-user", pass: "sonarr-pass" });
  });

  it("falls back to global credentials", () => {
    process.env.ARR_BASIC_USER = "global-user";
    process.env.ARR_BASIC_PASS = "global-pass";

    const result = getBasicCredentials("prowlarr");
    expect(result).toEqual({ user: "global-user", pass: "global-pass" });
  });

  it("returns empty strings when nothing is configured", () => {
    const result = getBasicCredentials("jellyseerr");
    expect(result).toEqual({ user: "", pass: "" });
  });
});
