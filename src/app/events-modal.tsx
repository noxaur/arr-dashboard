"use client";

import { useEffect, useRef } from "react";
import type { ActivityEvent } from "@/lib/events";
import {
  serviceColors,
  serviceNames,
  typeIcons,
  typeColors,
  formatTime,
} from "@/lib/events";

interface EventModalProps {
  event: ActivityEvent;
  onClose: () => void;
}

export function EventModal({ event, onClose }: EventModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const absTime = new Date(event.timestamp).toLocaleString();

  const detailRows: { label: string; value: string }[] = [];
  if (event.quality) detailRows.push({ label: "Quality", value: event.quality + (event.qualityVersion ? ` (v${event.qualityVersion})` : "") });
  if (event.size) detailRows.push({ label: "Size", value: event.size });
  if (event.indexer) detailRows.push({ label: "Indexer", value: event.indexer });
  if (event.downloadClient) detailRows.push({ label: "Client", value: event.downloadClient });
  if (event.source) detailRows.push({ label: "Source", value: event.source });
  if (event.protocol) detailRows.push({ label: "Protocol", value: event.protocol === "torrent" ? "Torrent" : "Usenet" });
  if (event.score !== undefined) detailRows.push({ label: "Score", value: `${event.score}/100` });
  if (event.user) detailRows.push({ label: "User", value: event.user });
  if (event.movie) detailRows.push({ label: "Movie", value: `${event.movie.title}${event.movie.year ? ` (${event.movie.year})` : ""}` });
  if (event.series) {
    detailRows.push({
      label: "Episode",
      value: `${event.series.title} S${String(event.series.season ?? 0).padStart(2, "0")}E${String(event.series.episode ?? 0).padStart(2, "0")}${event.series.episodeTitle ? ` — ${event.series.episodeTitle}` : ""}`,
    });
  }
  if (event.subtitle) {
    detailRows.push({ label: "Language", value: event.subtitle.language });
    if (event.subtitle.type) detailRows.push({ label: "Subtitle type", value: event.subtitle.type });
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        padding: "1rem",
      }}
    >
      <div
        className="card"
        role="dialog"
        aria-modal="true"
        style={{
          width: "100%",
          maxWidth: "520px",
          maxHeight: "90vh",
          overflow: "auto",
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between gap-3 px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2">
            <span
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center text-sm font-bold leading-none"
              style={{ color: typeColors[event.type] }}
              aria-hidden="true"
            >
              {typeIcons[event.type]}
            </span>
            <span
              className="rounded px-1.5 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: "var(--accent-bg)",
                color: serviceColors[event.service],
              }}
            >
              {serviceNames[event.service]}
            </span>
            <span
              className="rounded px-1.5 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: "var(--accent-bg)",
                color: typeColors[event.type],
              }}
            >
              {event.type}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-sm"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "var(--surface-hover)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <h3 className="mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {event.title}
          </h3>
          {event.message && (
            <p className="mb-4 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {event.message}
            </p>
          )}

          {/* Timestamp */}
          <div className="mb-4 rounded p-3 text-xs" style={{ backgroundColor: "var(--bg-elevated)" }}>
            <div style={{ color: "var(--text-muted)" }}>Timestamp</div>
            <div style={{ color: "var(--text-secondary)" }}>{formatTime(event.timestamp)}</div>
            <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>{absTime}</div>
          </div>

          {/* Detail fields */}
          {detailRows.length > 0 && (
            <div className="overflow-hidden rounded text-xs" style={{ border: "1px solid var(--border)" }}>
              {detailRows.map((row, i) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between px-3 py-2"
                  style={{
                    borderBottom: i < detailRows.length - 1 ? "1px solid var(--border)" : undefined,
                    backgroundColor: i % 2 === 0 ? "var(--surface)" : "var(--bg-elevated)",
                  }}
                >
                  <span style={{ color: "var(--text-muted)" }}>{row.label}</span>
                  <span className="ml-4 text-right font-medium" style={{ color: "var(--text-secondary)" }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>
            Event #{event.id}
          </span>
          <a
            href={`/${event.service}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost text-xs"
            style={{ color: serviceColors[event.service], textDecoration: "none" }}
          >
            Open in {serviceNames[event.service]} ↗
          </a>
        </div>
      </div>
    </div>
  );
}
