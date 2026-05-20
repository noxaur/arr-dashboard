"use client";

import { useState } from "react";
import Link from "next/link";
import { services } from "@/lib/services";

interface IframeViewProps {
  serviceId: string;
}

export function IframeView({ serviceId }: IframeViewProps) {
  const service = services[serviceId];
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (!service) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-[var(--text-muted)]">Service not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: "100vh" }}>
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2 bg-[var(--bg)]">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="btn-ghost text-xs"
            aria-label="Back to dashboard"
          >
            ← Back
          </Link>
          <div className="h-4 w-px bg-[var(--border)]" />
          <span className="text-sm font-medium">
            {service.name}
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            {service.description}
          </span>
        </div>

        <a
          href={service.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost text-xs"
        >
          Open in new tab ↗
        </a>
      </div>

      <div className="relative flex-1" style={{ height: "calc(100vh - 3.5rem)" }}>
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg)]">
            <div className="flex flex-col items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
              <p className="text-sm text-[var(--text-muted)]">Loading {service.name}...</p>
            </div>
          </div>
        )}

        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg)]">
            <div className="flex max-w-md flex-col items-center gap-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--error-bg)]">
                <span className="text-lg text-[var(--error)]">!</span>
              </div>
              <div>
                <h3 className="text-base font-medium">
                  Unable to embed {service.name}
                </h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  This service may block iframe embedding. Open it directly
                  instead.
                </p>
              </div>
              <a
                href={service.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                Open {service.name} directly
              </a>
            </div>
          </div>
        )}

        <iframe
          src={service.embedUrl}
          className="w-full border-0"
          style={{ height: "calc(100vh - 3.5rem)" }}
          title={`${service.name} settings`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-cookies"
        />
      </div>
    </div>
  );
}
