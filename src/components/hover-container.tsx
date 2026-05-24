"use client";

import { type ReactNode, useState } from "react";

export interface HoverContainerProps {
  content: ReactNode;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
  disabled?: boolean;
}

const arrowSvgs: Record<string, { viewBox: string; d: string; w: number; h: number }> = {
  top: { viewBox: "0 0 10 6", d: "M 0,0 L 5,5 L 10,0", w: 10, h: 6 },
  bottom: { viewBox: "0 0 10 6", d: "M 0,5 L 5,0 L 10,5", w: 10, h: 6 },
  left: { viewBox: "0 0 6 10", d: "M 0,0 L 5,5 L 0,10", w: 6, h: 10 },
  right: { viewBox: "0 0 6 10", d: "M 5,0 L 0,5 L 5,10", w: 6, h: 10 },
};

export function HoverContainer({ content, children, position = "top", className, disabled }: HoverContainerProps) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className={`relative inline-flex ${className ?? ""}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocusCapture={() => setVisible(true)}
      onBlurCapture={() => setVisible(false)}
    >
      {children}
      {!disabled && (
        <span
          role="tooltip"
          className={`
            absolute z-50 whitespace-nowrap rounded-lg border border-[var(--border)]
            bg-[var(--surface)] px-2 py-1 text-[11px] font-medium leading-[1.3]
            tracking-[0.01em] text-[var(--text-primary)]
            shadow-[0_2px_8px_0_var(--shadow)]
            pointer-events-none transition-opacity duration-150 ease-out
            ${visible ? "opacity-100" : "opacity-0"}
            ${position === "top" ? "bottom-full left-1/2 -translate-x-1/2 mb-[6px]" : ""}
            ${position === "bottom" ? "top-full left-1/2 -translate-x-1/2 mt-[6px]" : ""}
            ${position === "left" ? "right-full top-1/2 -translate-y-1/2 mr-[6px]" : ""}
            ${position === "right" ? "left-full top-1/2 -translate-y-1/2 ml-[6px]" : ""}
          `}
        >
          {content}
          <svg
            className={`
              absolute
              ${position === "top" ? "top-full left-1/2 -translate-x-1/2" : ""}
              ${position === "bottom" ? "bottom-full left-1/2 -translate-x-1/2" : ""}
              ${position === "left" ? "left-full top-1/2 -translate-y-1/2" : ""}
              ${position === "right" ? "right-full top-1/2 -translate-y-1/2" : ""}
            `}
            width={arrowSvgs[position].w}
            height={arrowSvgs[position].h}
            viewBox={arrowSvgs[position].viewBox}
          >
            <path
              d={arrowSvgs[position].d}
              fill="var(--surface)"
              stroke="var(--border)"
              strokeWidth="1"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
    </span>
  );
}
