import { describe, it, expect } from "vitest";
import { formatBytes, parseBytes } from "./format";

describe("formatBytes", () => {
  it("returns '0 B' for 0 bytes", () => {
    expect(formatBytes(0)).toBe("0 B");
  });

  it("formats bytes without unit conversion", () => {
    expect(formatBytes(500)).toBe("500 B");
  });

  it("formats kilobytes", () => {
    expect(formatBytes(1024)).toBe("1.0 KB");
  });

  it("formats megabytes", () => {
    expect(formatBytes(1048576)).toBe("1.0 MB");
  });

  it("formats gigabytes", () => {
    expect(formatBytes(1073741824)).toBe("1.0 GB");
  });

  it("formats terabytes", () => {
    expect(formatBytes(1099511627776)).toBe("1.0 TB");
  });
});

describe("parseBytes", () => {
  it("returns 0 for unknown format", () => {
    expect(parseBytes("invalid")).toBe(0);
  });

  it("parses bytes", () => {
    expect(parseBytes("500 B")).toBe(500);
  });

  it("parses kilobytes", () => {
    expect(parseBytes("1 KB")).toBe(1024);
  });

  it("parses megabytes", () => {
    expect(parseBytes("1 MB")).toBe(1048576);
  });

  it("parses gigabytes", () => {
    expect(parseBytes("1 GB")).toBe(1073741824);
  });

  it("parses terabytes", () => {
    expect(parseBytes("1 TB")).toBe(1099511627776);
  });

  it("parses decimal values", () => {
    expect(parseBytes("1.5 GB")).toBe(1610612736);
  });

  it("handles numeric input directly", () => {
    expect(parseBytes(500)).toBe(500);
  });

  it("returns 0 for non-finite numeric input", () => {
    expect(parseBytes(Infinity)).toBe(0);
  });

  it("round-trips with formatBytes", () => {
    const testValues = [0, 500, 1024, 2048, 1048576, 1073741824, 1610612736];
    for (const bytes of testValues) {
      expect(parseBytes(formatBytes(bytes))).toBe(bytes);
    }
  });
});
