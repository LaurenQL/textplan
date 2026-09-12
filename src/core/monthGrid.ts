import type { PlainDate } from "./date";

export interface MonthGridCell {
  date: PlainDate;
  inCurrentMonth: boolean;
}

export function createMonthGrid(monthDate: PlainDate, weekStartDay: number): MonthGridCell[] {
  const startDay = normalizeWeekStartDay(weekStartDay);
  const firstOfMonth = new Date(monthDate.year, monthDate.month - 1, 1);
  const firstWeekday = firstOfMonth.getDay();
  const leadingDays = (firstWeekday - startDay + 7) % 7;
  const gridStart = new Date(monthDate.year, monthDate.month - 1, 1 - leadingDays);
  const cells: MonthGridCell[] = [];

  for (let index = 0; index < 42; index += 1) {
    const current = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
    cells.push({
      date: {
        year: current.getFullYear(),
        month: current.getMonth() + 1,
        day: current.getDate(),
      },
      inCurrentMonth: current.getMonth() === monthDate.month - 1,
    });
  }

  return cells;
}

export function getWeekdayLabels(weekStartDay: number, locale: "zh" | "en"): string[] {
  const zh = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const en = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const labels = locale === "zh" ? zh : en;
  const start = normalizeWeekStartDay(weekStartDay);
  return [...labels.slice(start), ...labels.slice(0, start)];
}

function normalizeWeekStartDay(day: number): number {
  return ((day % 7) + 7) % 7;
}

