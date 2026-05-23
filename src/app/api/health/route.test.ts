import { describe, it, expect, vi } from "vitest";
import { GET } from "./route";
vi.mock("@/lib/services", () => ({
  serviceOrder: ["radarr", "sonarr", "prowlarr", "bazarr", "jellyseerr"],
}));
vi.mock("@/lib/api", () => ({
  checkHealth: vi.fn(),
}));
import { checkHealth } from "@/lib/api";
describe("GET /api/health", () => {
  it("returns 400 for invalid service id", async () => {
    const request = new Request("http://localhost:5487/api/health?service=invalid");
    const response = await GET(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ error: "Invalid service: invalid" });
  });
  it("accepts valid service id", async () => {
    vi.mocked(checkHealth).mockResolvedValue({ status: "ok", version: "4.0.0", responseTime: 42 });
    const request = new Request("http://localhost:5487/api/health?service=radarr");
    const response = await GET(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ radarr: { status: "ok", version: "4.0.0", responseTime: 42 } });
  });
  it("works without service parameter", async () => {
    vi.mocked(checkHealth).mockResolvedValue({ status: "ok", version: "4.0.0", responseTime: 42 });
    const request = new Request("http://localhost:5487/api/health");
    const response = await GET(request);
    expect(response.status).toBe(200);
  });
});
