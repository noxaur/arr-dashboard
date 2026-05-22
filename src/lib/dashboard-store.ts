import { create } from "zustand";
import type { DashboardResponse } from "./types";

interface DashboardStore {
  data: DashboardResponse | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  fetchData: () => Promise<void>;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  data: null,
  loading: true,
  error: null,
  lastUpdated: null,
  fetchData: async () => {
    try {
      set({ loading: true, error: null });
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: DashboardResponse = await res.json();
      set({ data, loading: false, lastUpdated: new Date() });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Network error",
        loading: false,
      });
    }
  },
}));
