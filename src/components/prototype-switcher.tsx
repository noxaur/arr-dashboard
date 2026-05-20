"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface PrototypeSwitcherProps {
  variants: string[];
  current: string;
}

const variantLabels: Record<string, string> = {
  a: "Classic Grid",
  b: "Sidebar Nav",
  c: "Kanban Board",
};

export function PrototypeSwitcher({ variants, current }: PrototypeSwitcherProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const navigate = useCallback(
    (direction: "prev" | "next") => {
      const currentIndex = variants.indexOf(current);
      const nextIndex =
        direction === "next"
          ? (currentIndex + 1) % variants.length
          : (currentIndex - 1 + variants.length) % variants.length;
      const nextVariant = variants[nextIndex];
      const params = new URLSearchParams(searchParams.toString());
      params.set("variant", nextVariant);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [variants, current, searchParams, router],
  );

  return (
    <div
      className="fixed bottom-6 left-1/2 z-50 flex items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2"
      style={{ transform: "translateX(-50%)", boxShadow: "0 4px 16px var(--shadow-lg)" }}
    >
      <button
        className="btn-ghost text-xs"
        onClick={() => navigate("prev")}
        aria-label="Previous variant"
      >
        ←
      </button>
      <span className="text-xs font-medium">
        {variantLabels[current] || current}
      </span>
      <button
        className="btn-ghost text-xs"
        onClick={() => navigate("next")}
        aria-label="Next variant"
      >
        →
      </button>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        Prototype
      </span>
    </div>
  );
}
