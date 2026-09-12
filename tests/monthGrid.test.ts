import { describe, expect, it } from "vitest";
import { createMonthGrid, getWeekdayLabels } from "../src/core/monthGrid";

describe("monthGrid", () => {
  it("creates a 42-cell month grid starting on the configured week start day", () => {
    const cells = createMonthGrid({ year: 2026, month: 8, day: 1 }, 0);

    expect(cells).toHaveLength(42);
    expect(cells[0].date).toEqual({ year: 2026, month: 7, day: 26 });
    expect(cells[6].date).toEqual({ year: 2026, month: 8, day: 1 });
  });

  it("returns localized weekday labels", () => {
    expect(getWeekdayLabels(1, "en")).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
    expect(getWeekdayLabels(0, "zh")).toEqual(["周日", "周一", "周二", "周三", "周四", "周五", "周六"]);
  });
});

