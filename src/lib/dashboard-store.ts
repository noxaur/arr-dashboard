import { create } from "zustand";
import type { DashboardResponse } from "./types";

interface DashboardStore {
  data: DashboardResponse | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  fetchData: () => Promise<void>;
}

let abortController: AbortController | null = null;

export const useDashboardStore = create<DashboardStore>((set) => ({
  data: null,
  loading: true,
  error: null,
  lastUpdated: null,
  fetchData: async () => {
    abortController?.abort();
    const controller = new AbortController();
    abortController = controller;
    try {
      set({ loading: true, error: null });
      const res = await fetch("/api/dashboard", { cache: "no-store", signal: controller.signal });
      if (controller.signal.aborted) return;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: DashboardResponse = await res.json();
      if (controller.signal.aborted) return;
      set({ data, loading: false, lastUpdated: new Date() });
    } catch (e) {
      if (controller.signal.aborted) return;
      set({
        error: e instanceof Error ? e.message : "Network error",
        loading: false,
      });
    }
  },
}));
