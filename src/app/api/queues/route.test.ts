import { describe, it, expect, vi } from "vitest";
import { GET } from "./route";
vi.mock("@/lib/services", () => ({
  serviceOrder: ["radarr", "sonarr", "prowlarr", "bazarr", "jellyseerr"],
}));
vi.mock("@/lib/api", () => ({
  getQueue: vi.fn(),
}));
import { getQueue } from "@/lib/api";
describe("GET /api/queues", () => {
  it("returns 400 for invalid service id", async () => {
    const request = new Request("http://localhost:5487/api/queues?service=invalid");
    const response = await GET(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ error: "Invalid service: invalid" });
  });
  it("accepts valid service id", async () => {
    vi.mocked(getQueue).mockResolvedValue([{ id: 1, title: "Test", status: "completed" }]);
    const request = new Request("http://localhost:5487/api/queues?service=sonarr");
    const response = await GET(request);
    expect(response.status).toBe(200);
  });
  it("works without service parameter", async () => {
    vi.mocked(getQueue).mockResolvedValue([]);
    const request = new Request("http://localhost:5487/api/queues");
    const response = await GET(request);
    expect(response.status).toBe(200);
  });
});
