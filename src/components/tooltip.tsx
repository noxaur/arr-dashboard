"use client";

import { type ReactNode } from "react";
import { HoverContainer } from "@/components/hover-container";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  disabled?: boolean;
}

export function Tooltip({ content, children, position, disabled }: TooltipProps) {
  return (
    <HoverContainer content={content} position={position} disabled={disabled}>
      {children}
    </HoverContainer>
  );
}
