"use client";
import { useState } from "react";

export function ServiceActions({ serviceId, hasQueue }: { serviceId: string; hasQueue: boolean }) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (action: string) => {
    setLoading(action);
    try {
      const res = await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service: serviceId, action }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Action failed: ${res.status}`);
      }
    } catch (error) {
      console.error(`Action ${action} failed for ${serviceId}:`, error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {hasQueue && (
        <button
          className="btn-ghost"
          onClick={() => handleAction("pause")}
          disabled={loading === "pause"}
        >
          {loading === "pause" ? "..." : "Pause"}
        </button>
      )}
      <button
        className="btn-ghost"
        onClick={() => handleAction("refresh")}
        disabled={loading === "refresh"}
      >
        {loading === "refresh" ? "..." : "Refresh"}
      </button>
      {(serviceId === "radarr" || serviceId === "sonarr") && (
        <button
          className="btn-ghost"
          onClick={() => handleAction("search")}
          disabled={loading === "search"}
        >
          {loading === "search" ? "..." : "Search"}
        </button>
      )}
    </div>
  );
}
