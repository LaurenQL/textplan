import { describe, expect, it } from "vitest";
import { formatDateFileName, getDailyNotePath } from "../src/core/fileName";

describe("fileName", () => {
  it("formats default date file names", () => {
    expect(formatDateFileName("YYYYMMDD.md", { year: 2026, month: 8, day: 9 })).toBe("20260809.md");
  });

  it("supports separators and nested paths in the format", () => {
    expect(formatDateFileName("YYYY/MM/DD.md", { year: 2026, month: 8, day: 29 })).toBe("2026/08/29.md");
  });

  it("joins and normalizes daily note paths", () => {
    expect(getDailyNotePath("textplan/", "YYYY-MM-DD.md", { year: 2026, month: 8, day: 29 })).toBe(
      "textplan/2026-08-29.md",
    );
  });
});

