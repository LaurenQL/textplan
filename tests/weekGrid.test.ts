import { describe, expect, it } from "vitest";
import { createWeekGrid } from "../src/core/weekGrid";

describe("createWeekGrid", () => {
  it("returns exactly 7 cells", () => {
    const cells = createWeekGrid({ year: 2026, month: 9, day: 6 }, 1);
    expect(cells).toHaveLength(7);
  });

  it("week starts on Monday (weekStartDay=1) and contains the anchor date", () => {
    // 2026-09-06 is a Sunday
    const cells = createWeekGrid({ year: 2026, month: 9, day: 6 }, 1);
    // Monday of that week is 2026-08-31
    expect(cells[0].date).toEqual({ year: 2026, month: 8, day: 31 });
    expect(cells[6].date).toEqual({ year: 2026, month: 9, day: 6 });
    expect(cells.some((c) => c.date.year === 2026 && c.date.month === 9 && c.date.day === 6)).toBe(true);
  });

  it("week starts on Sunday (weekStartDay=0) and contains the anchor date", () => {
    // 2026-09-06 is a Sunday — should be the first cell
    const cells = createWeekGrid({ year: 2026, month: 9, day: 6 }, 0);
    expect(cells[0].date).toEqual({ year: 2026, month: 9, day: 6 });
    expect(cells[6].date).toEqual({ year: 2026, month: 9, day: 12 });
  });

  it("handles cross-month boundary (start of month)", () => {
    // 2026-09-01 is a Tuesday; with weekStartDay=1 (Mon), week starts 2026-08-31
    const cells = createWeekGrid({ year: 2026, month: 9, day: 1 }, 1);
    expect(cells[0].date).toEqual({ year: 2026, month: 8, day: 31 });
    expect(cells[1].date).toEqual({ year: 2026, month: 9, day: 1 });
    expect(cells[6].date).toEqual({ year: 2026, month: 9, day: 6 });
  });

  it("handles cross-year boundary (end of year)", () => {
    // 2025-12-31 is a Wednesday; with weekStartDay=1, week starts 2025-12-29
    const cells = createWeekGrid({ year: 2025, month: 12, day: 31 }, 1);
    expect(cells[0].date).toEqual({ year: 2025, month: 12, day: 29 });
    expect(cells[3].date).toEqual({ year: 2026, month: 1, day: 1 });
    expect(cells[6].date).toEqual({ year: 2026, month: 1, day: 4 });
  });

  it("handles cross-year boundary (start of year)", () => {
    // 2026-01-01 is a Thursday; with weekStartDay=0 (Sun), week starts 2025-12-28
    const cells = createWeekGrid({ year: 2026, month: 1, day: 1 }, 0);
    expect(cells[0].date).toEqual({ year: 2025, month: 12, day: 28 });
    expect(cells[4].date).toEqual({ year: 2026, month: 1, day: 1 });
  });

  it("weekdayIndex matches the JS Date getDay() value", () => {
    const cells = createWeekGrid({ year: 2026, month: 9, day: 6 }, 0);
    cells.forEach((cell) => {
      const d = new Date(cell.date.year, cell.date.month - 1, cell.date.day);
      expect(cell.weekdayIndex).toBe(d.getDay());
    });
  });

  it("cells are consecutive days", () => {
    const cells = createWeekGrid({ year: 2026, month: 9, day: 6 }, 1);
    for (let i = 1; i < cells.length; i++) {
      const prev = new Date(cells[i - 1].date.year, cells[i - 1].date.month - 1, cells[i - 1].date.day);
      const curr = new Date(cells[i].date.year, cells[i].date.month - 1, cells[i].date.day);
      expect(curr.getTime() - prev.getTime()).toBe(24 * 60 * 60 * 1000);
    }
  });
});
