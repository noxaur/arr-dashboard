"use client";
import { useState, useEffect, useRef } from "react";

export function ServiceActions({ serviceId, hasQueue }: { serviceId: string; hasQueue: boolean }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, []);

  const showFeedback = (type: "success" | "error", message: string) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback({ type, message });
    feedbackTimer.current = setTimeout(() => {
      setFeedback(null);
      feedbackTimer.current = null;
    }, 3000);
  };

  const handleAction = async (action: string) => {
    setLoading(action);
    setFeedback(null);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
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
      showFeedback("success", `${action} started`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Action failed";
      console.error(`Action ${action} failed for ${serviceId}:`, error);
      showFeedback("error", message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col gap-1">
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
      {feedback && (
        <p
          className="text-xs"
          style={{
            color: feedback.type === "error" ? "var(--error)" : "var(--success)",
          }}
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
}
