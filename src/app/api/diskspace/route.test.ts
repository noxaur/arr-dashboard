import { describe, it, expect } from "vitest";
import { parseBytes } from "./route";

describe("parseBytes", () => {
  it("handles numeric input", () => {
    expect(parseBytes(1024)).toBe(1024);
  });

  it("returns 0 for NaN numeric input", () => {
    expect(parseBytes(NaN)).toBe(0);
  });

  it("returns 0 for Infinity numeric input", () => {
    expect(parseBytes(Infinity)).toBe(0);
  });

  it("handles zero numeric input", () => {
    expect(parseBytes(0)).toBe(0);
  });

  it('handles "B" unit', () => {
    expect(parseBytes("500 B")).toBe(500);
  });

  it('handles "KB" unit with binary multiplier', () => {
    expect(parseBytes("1 KB")).toBe(1024);
  });

  it('handles "MB" unit', () => {
    expect(parseBytes("1 MB")).toBe(1048576);
  });

  it('handles "GB" unit', () => {
    expect(parseBytes("1 GB")).toBe(1073741824);
  });

  it('handles "TB" unit', () => {
    expect(parseBytes("1 TB")).toBe(1099511627776);
  });

  it("handles decimal values", () => {
    expect(parseBytes("1.5 GB")).toBe(1610612736);
  });

  it("returns 0 for N/A string", () => {
    expect(parseBytes("N/A")).toBe(0);
  });

  it("returns 0 for empty string", () => {
    expect(parseBytes("")).toBe(0);
  });

  it("is case-insensitive", () => {
    expect(parseBytes("1 mb")).toBe(1048576);
    expect(parseBytes("1 Gb")).toBe(1073741824);
  });

  it("handles very large values without precision loss", () => {
    expect(parseBytes("100 TB")).toBe(109951162777600);
  });

  it("handles string '0'", () => {
    expect(parseBytes("0 B")).toBe(0);
  });

  it("handles negative values", () => {
    expect(parseBytes("-1 GB")).toBe(0);
  });
});
