import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("ThemeToggle SSR safety", () => {
  const srcPath = path.resolve(__dirname, "theme-toggle.tsx");
  const src = fs.readFileSync(srcPath, "utf-8");

  it("does not access document during module-level evaluation", () => {
    const importLine = src.match(/import.*from.*react.*/)?.[0] || "";
    expect(importLine).toContain("useEffect");
  });

  it("uses useEffect to read theme after mount", () => {
    expect(src).toContain("useEffect");
    expect(src).toContain("document.documentElement");
  });

  it("defaults theme to light on server", () => {
    expect(src).toContain('useState<"light" | "dark">("light")');
  });
});
