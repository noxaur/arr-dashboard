import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/api", () => ({
  pauseQueue: vi.fn().mockResolvedValue(true),
  refreshMonitored: vi.fn().mockResolvedValue(true),
  searchMissing: vi.fn().mockResolvedValue(true),
}));

function mockRequest(overrides: {
  origin?: string | null;
  host?: string | null;
  body?: object;
}) {
  const headers = new Map<string, string>();
  if (overrides.origin !== undefined && overrides.origin !== null) {
    headers.set("origin", overrides.origin);
  }
  if (overrides.host !== undefined && overrides.host !== null) {
    headers.set("host", overrides.host);
  }

  return new Request("http://localhost/api/actions", {
    method: "POST",
    headers: Object.fromEntries(headers),
    body: overrides.body ? JSON.stringify(overrides.body) : '{"service":"radarr","action":"pause"}',
  });
}

describe("POST /api/actions CSRF guard", () => {
  it("rejects request with missing origin header", async () => {
    const req = mockRequest({ origin: null, host: "localhost" });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(403);
    expect(body.error).toBe("Missing origin header");
  });

  it("rejects request with missing host header", async () => {
    const req = mockRequest({ origin: "http://localhost", host: null });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(403);
    expect(body.error).toBe("Missing host header");
  });

  it("rejects request with both headers missing", async () => {
    const req = mockRequest({ origin: null, host: null });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("rejects request with mismatched origin and host", async () => {
    const req = mockRequest({ origin: "http://evil.com", host: "localhost" });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(403);
    expect(body.error).toBe("Cross-origin requests not allowed");
  });

  it("rejects request with invalid origin URL", async () => {
    const req = mockRequest({ origin: "not-a-url", host: "localhost" });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(403);
    expect(body.error).toBe("Invalid origin");
  });

  it("allows request with valid same-origin headers", async () => {
    const req = mockRequest({ origin: "http://localhost:3000", host: "localhost:3000" });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("uses referer as fallback when origin is missing", async () => {
    const req = new Request("http://localhost/api/actions", {
      method: "POST",
      headers: { referer: "http://localhost:3000/page", host: "localhost:3000" },
      body: '{"service":"radarr","action":"pause"}',
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
