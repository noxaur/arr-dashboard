"use client";
import { useState } from "react";
import type { ActivityEvent } from "@/lib/events";
import { serviceColors, serviceNames, typeColors, typeIcons, formatTime } from "@/lib/events";
import { Tooltip } from "@/components/tooltip";

interface EventRowProps {
  group: { events: ActivityEvent[]; count: number };
  isGroup: boolean;
  hasSearch: boolean;
  onEventClick: (event: ActivityEvent) => void;
}

export function EventRow({ group, isGroup, hasSearch, onEventClick }: EventRowProps) {
  const primary = group.events[0];
  const [expanded, setExpanded] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const handlePrimaryClick = () => {
    if (isGroup && !hasSearch) {
      setExpanded(!expanded);
    } else {
      onEventClick(primary);
    }
  };

  return (
    <>
      <div
        onClick={handlePrimaryClick}
        className="flex items-center gap-3 px-5 py-3"
        style={{ cursor: "pointer", transition: "background-color 150ms ease" }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = "var(--surface-hover)";
          setShowInfo(true);
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
          setShowInfo(false);
        }}
      >
        <span
          className="flex h-5 w-5 flex-shrink-0 items-center justify-center text-[20px] font-bold leading-none"
          style={{ color: typeColors[primary.type] }}
          aria-hidden="true"
        >
          {typeIcons[primary.type]}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-medium" style={{ color: serviceColors[primary.service] }}>
              {serviceNames[primary.service]}
            </span>
            <span className="truncate text-xs" style={{ color: "var(--text-secondary)" }}>
              {primary.title}
            </span>
          </div>
          {primary.message && (
            <p className="mt-0.5 truncate text-xs" style={{ color: "var(--text-muted)" }}>
              {primary.message}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {isGroup && !hasSearch && (
            <Tooltip content="More events">
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                style={{ backgroundColor: "var(--accent-bg)", color: "var(--accent)" }}
              >
                +{group.count - 1}
              </span>
            </Tooltip>
          )}
          {isGroup && showInfo && !hasSearch && (
            <Tooltip content="View details">
              <button
                onClick={(e) => { e.stopPropagation(); onEventClick(primary); }}
                className="flex h-5 w-5 items-center justify-center rounded text-xs"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "var(--surface-hover)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
              >
                ⓘ
              </button>
            </Tooltip>
          )}
          <span className="text-xs flex-shrink-0" style={{ color: "var(--text-muted)" }}>
            {formatTime(primary.timestamp)}
          </span>
        </div>
      </div>

      {isGroup && expanded && !hasSearch && (
        <>
          <div
            className="px-5 py-1.5 text-[10px] font-medium"
            style={{
              backgroundColor: "var(--bg-elevated)",
              color: "var(--text-muted)",
              borderLeft: `3px solid ${serviceColors[primary.service]}`,
              borderTop: "1px solid var(--border)",
            }}
          >
            {group.count - 1} more {group.count - 1 === 1 ? "event" : "events"}
          </div>
          {group.events.slice(1).map((event, subIdx) => (
            <div
              key={event.id}
              onClick={() => onEventClick(event)}
              className="flex items-center gap-3 px-5 py-2.5"
              style={{
                borderTop: subIdx > 0 ? "1px solid var(--border)" : undefined,
                borderLeft: `3px solid ${serviceColors[primary.service]}`,
                backgroundColor: "var(--bg-elevated)",
                cursor: "pointer",
                transition: "opacity 150ms ease",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.8"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs" style={{ color: "var(--text-secondary)" }}>
                  {event.message}
                </p>
              </div>
              <span className="flex-shrink-0 text-xs" style={{ color: "var(--text-muted)" }}>
                {formatTime(event.timestamp)}
              </span>
            </div>
          ))}
        </>
      )}
    </>
  );
}
