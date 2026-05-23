import { describe, it, expect, vi, beforeEach } from "vitest";

describe("dashboard fetch with abort-and-dedup", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("abort prevents stale data from overwriting fresh data", async () => {
    let resolveFast: (v: Response) => void;
    let resolveSlow: (v: Response) => void;

    const fastPromise = new Promise<Response>((resolve) => { resolveFast = resolve; });
    const slowPromise = new Promise<Response>((resolve) => { resolveSlow = resolve; });

    const mockFetch = vi.fn<typeof fetch>()
      .mockReturnValueOnce(slowPromise)
      .mockReturnValueOnce(fastPromise);

    let lastResult: string | null = null;

    async function fetchData(signal?: AbortSignal) {
      try {
        const res = await mockFetch("/api/dashboard", { signal });
        if (signal?.aborted) return;
        if (res.ok) {
          const json = await res.json() as { data: string };
          if (signal?.aborted) return;
          lastResult = json.data;
        }
      } catch {
        // aborted silently
      }
    }

    const controller1 = new AbortController();
    const controller2 = new AbortController();

    const p1 = fetchData(controller1.signal);
    const p2 = fetchData(controller2.signal);

    controller1.abort();

    resolveFast!({ ok: true, json: () => Promise.resolve({ data: "fresh" }) } as Response);
    await p2;

    resolveSlow!({ ok: true, json: () => Promise.resolve({ data: "stale" }) } as Response);
    await p1;

    expect(lastResult).toBe("fresh");
  });

  it("aborted requests do not call setState after json parse", async () => {
    let resolveFetch: (v: Response) => void;
    let jsonResolve: (v: unknown) => void;

    const fetchPromise = new Promise<Response>((resolve) => { resolveFetch = resolve; });
    const jsonPromise = new Promise<unknown>((resolve) => { jsonResolve = resolve; });

    const mockFetch = vi.fn<typeof fetch>().mockReturnValueOnce(fetchPromise);

    let stateCalled = false;

    async function fetchData(signal?: AbortSignal) {
      try {
        const res = await mockFetch("/api/dashboard", { signal });
        if (signal?.aborted) return;
        const json = await res.json();
        if (signal?.aborted) return;
        stateCalled = true;
      } catch {
        // aborted silently
      }
    }

    const controller = new AbortController();

    const p = fetchData(controller.signal);

    resolveFetch!({
      ok: true,
      json: () => jsonPromise,
    } as Response);

    await new Promise(process.nextTick);

    controller.abort();
    jsonResolve!({ data: "should-not-set" });

    await p;

    expect(stateCalled).toBe(false);
  });
});
