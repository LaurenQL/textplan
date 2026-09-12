import type { PlainDate } from "./date";

export interface WeekGridCell {
  date: PlainDate;
  weekdayIndex: number; // 0 = Sun, 1 = Mon, … 6 = Sat
}

/**
 * Returns exactly 7 DayCell-compatible cells for the week that contains `date`.
 * Week start is governed by `weekStartDay` (0 = Sun, 1 = Mon, … 6 = Sat).
 */
export function createWeekGrid(date: PlainDate, weekStartDay: number): WeekGridCell[] {
  const start = normalizeWeekStartDay(weekStartDay);
  const anchor = new Date(date.year, date.month - 1, date.day);
  const anchorWeekday = anchor.getDay();
  const leadingDays = (anchorWeekday - start + 7) % 7;
  const weekStart = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - leadingDays);

  const cells: WeekGridCell[] = [];
  for (let i = 0; i < 7; i++) {
    const current = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i);
    cells.push({
      date: {
        year: current.getFullYear(),
        month: current.getMonth() + 1,
        day: current.getDate(),
      },
      weekdayIndex: current.getDay(),
    });
  }

  return cells;
}

function normalizeWeekStartDay(day: number): number {
  return ((day % 7) + 7) % 7;
}
