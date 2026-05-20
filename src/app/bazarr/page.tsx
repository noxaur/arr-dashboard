"use client";

import { useEffect } from "react";
import { services } from "@/lib/services";
import Link from "next/link";

export default function BazarrPage() {
  const service = services.bazarr;

  useEffect(() => {
    window.location.href = service.url;
  }, [service.url]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <p className="text-sm text-[var(--text-muted)]">Opening {service.name}...</p>
        <Link href={service.url} className="mt-4 inline-block text-sm" style={{ color: "var(--accent)" }}>
          Click here if not redirected ↗
        </Link>
      </div>
    </div>
  );
}
