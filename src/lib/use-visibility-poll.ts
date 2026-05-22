"use client";
import { useEffect } from "react";

export function useVisibilityPoll(
  fetcher: () => Promise<void>,
  intervalMs = 30000
) {
  useEffect(() => {
    fetcher();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") fetcher();
    }, intervalMs);
    return () => clearInterval(id);
  }, [fetcher, intervalMs]);
}
