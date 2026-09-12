export interface PlainDate {
  year: number;
  month: number;
  day: number;
}

export function today(): PlainDate {
  return fromDate(new Date());
}

export function fromDate(date: Date): PlainDate {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

export function toDate(date: PlainDate): Date {
  return new Date(date.year, date.month - 1, date.day);
}

export function formatIsoDate(date: PlainDate): string {
  return `${date.year}-${pad2(date.month)}-${pad2(date.day)}`;
}

export function formatChineseDate(date: PlainDate): string {
  return `${date.year}年${date.month}月${date.day}日 ${getWeekdayName(date, "zh")}`;
}

/** 跟随语言的完整日期，用于 aria-label 和 tooltip。 */
export function formatFullDate(date: PlainDate, locale: "zh" | "en"): string {
  if (locale === "zh") {
    return formatChineseDate(date);
  }
  return `${EN_MONTHS[date.month - 1]} ${date.day}, ${date.year} ${getWeekdayName(date, "en")}`;
}

export function getWeekdayName(date: PlainDate, locale: "zh" | "en"): string {
  const weekday = toDate(date).getDay();
  if (locale === "zh") {
    return ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][weekday];
  }
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][weekday];
}

export function isSameDate(a: PlainDate, b: PlainDate): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

export function addDays(date: PlainDate, delta: number): PlainDate {
  const d = new Date(date.year, date.month - 1, date.day + delta);
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

const EN_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function formatMonthTitle(date: PlainDate, locale: "zh" | "en"): string {
  if (locale === "zh") {
    return `${date.year}年${date.month}月`;
  }
  return `${EN_MONTHS[date.month - 1]} ${date.year}`;
}

export function formatWeekRange(start: PlainDate, end: PlainDate, locale: "zh" | "en"): string {
  if (locale === "zh") {
    if (start.year === end.year && start.month === end.month) {
      return `${start.year}年${start.month}月${start.day}日 — ${end.day}日`;
    }
    if (start.year === end.year) {
      return `${start.year}年${start.month}月${start.day}日 — ${end.month}月${end.day}日`;
    }
    return `${start.year}年${start.month}月${start.day}日 — ${end.year}年${end.month}月${end.day}日`;
  }
  const mo = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (start.year === end.year && start.month === end.month) {
    return `${mo[start.month - 1]} ${start.day}–${end.day}, ${start.year}`;
  }
  if (start.year === end.year) {
    return `${mo[start.month - 1]} ${start.day} – ${mo[end.month - 1]} ${end.day}, ${start.year}`;
  }
  return `${mo[start.month - 1]} ${start.day}, ${start.year} – ${mo[end.month - 1]} ${end.day}, ${end.year}`;
}

export function addMonths(date: PlainDate, delta: number): PlainDate {
  const next = new Date(date.year, date.month - 1 + delta, 1);
  return {
    year: next.getFullYear(),
    month: next.getMonth() + 1,
    day: 1,
  };
}

export function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

