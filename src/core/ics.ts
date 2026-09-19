import { addDays, type PlainDate } from "./date";

export interface CalendarEvent {
  /** 事件开始日期。跨天事件每天都会展开成一条，方便日历按天取用。 */
  date: PlainDate;
  /** 全天事件没有具体时刻。 */
  allDay: boolean;
  /** 形如 "09:30" 的本地时刻，全天事件为空字符串。 */
  startTime: string;
  endTime: string;
  summary: string;
  location: string;
  /** 订阅源名称，日历上用来区分事件来自哪个日历。 */
  sourceName: string;
}

export interface ParsedCalendar {
  /** 按日期键（year-month-day）索引，方便日历按天查。 */
  eventsByDate: Map<string, CalendarEvent[]>;
  /** 解析过程中跳过的属性行数，仅用于诊断。 */
  skippedLines: number;
}

/** 展开重复规则的次数上限，防止每天重复的事件撑爆日历。 */
const MAX_OCCURRENCES = 400;
/** 单个跨天事件最多展开多少天。 */
const MAX_SPAN_DAYS = 60;

export function dateKey(date: PlainDate): string {
  return `${date.year}-${date.month}-${date.day}`;
}

/**
 * 解析 ICS 文本。只读，不回写，也不做任何网络之外的处理。
 *
 * 支持的能力刚好覆盖「只读展示日程」这个需求：日期时间、全天事件、跨天事件、
 * SUMMARY / LOCATION、以及 RRULE 的 DAILY / WEEKLY / MONTHLY / YEARLY 四种
 * 基础频率。不支持的 RRULE 部分降级为「只显示起始那一次」，不会丢弃事件。
 */
export function parseIcs(content: string, sourceName: string, windowStart: PlainDate, windowEnd: PlainDate): ParsedCalendar {
  const eventsByDate = new Map<string, CalendarEvent[]>();
  let skippedLines = 0;

  for (const block of splitEvents(content)) {
    const properties = parseProperties(block);
    const start = properties.get("DTSTART");
    if (!start) {
      continue;
    }

    const parsedStart = parseIcsDateTime(start, properties.get("DTSTART_PARAMS") ?? "");
    if (!parsedStart) {
      skippedLines += 1;
      continue;
    }

    const end = properties.get("DTEND");
    const parsedEnd = end ? parseIcsDateTime(end, properties.get("DTEND_PARAMS") ?? "") : null;
    const summary = unescapeText(properties.get("SUMMARY") ?? "");
    const location = unescapeText(properties.get("LOCATION") ?? "");
    const allDay = parsedStart.allDay;

    const occurrences = expandOccurrences(
      parsedStart,
      properties.get("RRULE") ?? "",
      properties.get("EXDATE") ?? "",
      windowStart,
      windowEnd,
    );

    for (const occurrence of occurrences) {
      const spanDays = parsedEnd ? getSpanDays(occurrence, parsedEnd) : 1;
      const capped = Math.min(spanDays, MAX_SPAN_DAYS);
      for (let offset = 0; offset < capped; offset += 1) {
        const day = addDays(occurrence.date, offset);
        if (!isWithin(day, windowStart, windowEnd)) {
          continue;
        }
        pushEvent(eventsByDate, {
          date: day,
          allDay,
          startTime: allDay ? "" : formatTime(occurrence.hour, occurrence.minute),
          endTime: allDay || !parsedEnd ? "" : formatTime(parsedEnd.hour, parsedEnd.minute),
          summary: summary || "(untitled)",
          location,
          sourceName,
        });
      }
    }
  }

  eventsByDate.forEach((list) => {
    list.sort((a, b) => {
      if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
      return a.startTime.localeCompare(b.startTime);
    });
  });

  return { eventsByDate, skippedLines };
}

function pushEvent(map: Map<string, CalendarEvent[]>, event: CalendarEvent): void {
  const key = dateKey(event.date);
  const list = map.get(key);
  if (list) {
    list.push(event);
  } else {
    map.set(key, [event]);
  }
}

/** ICS 用 CRLF，且长行会折行（续行以空格或 Tab 开头）。 */
function unfoldLines(content: string): string[] {
  const rawLines = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const lines: string[] = [];

  for (const line of rawLines) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && lines.length > 0) {
      lines[lines.length - 1] += line.slice(1);
    } else {
      lines.push(line);
    }
  }

  return lines;
}

function splitEvents(content: string): string[][] {
  const lines = unfoldLines(content);
  const blocks: string[][] = [];
  let current: string[] | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "BEGIN:VEVENT") {
      current = [];
      continue;
    }
    if (trimmed === "END:VEVENT") {
      if (current) blocks.push(current);
      current = null;
      continue;
    }
    if (current !== null) {
      current.push(trimmed);
    }
  }

  return blocks;
}

function parseProperties(block: string[]): Map<string, string> {
  const properties = new Map<string, string>();

  for (const line of block) {
    const separator = line.indexOf(":");
    if (separator <= 0) {
      continue;
    }

    const rawName = line.slice(0, separator);
    const value = line.slice(separator + 1);
    const semicolon = rawName.indexOf(";");
    const name = (semicolon === -1 ? rawName : rawName.slice(0, semicolon)).toUpperCase();
    const params = semicolon === -1 ? "" : rawName.slice(semicolon + 1);

    if (name === "DTSTART") {
      properties.set("DTSTART", value);
      properties.set("DTSTART_PARAMS", params.toUpperCase());
    } else if (name === "DTEND") {
      properties.set("DTEND", value);
      properties.set("DTEND_PARAMS", params.toUpperCase());
    } else if (name === "SUMMARY") {
      properties.set("SUMMARY", value);
    } else if (name === "LOCATION") {
      properties.set("LOCATION", value);
    } else if (name === "RRULE") {
      properties.set("RRULE", value);
    } else if (name === "EXDATE") {
      // EXDATE 可以出现多次，也可能一次带多个逗号分隔的值
      const existing = properties.get("EXDATE");
      properties.set("EXDATE", existing ? `${existing},${value}` : value);
    }
  }

  return properties;
}

interface IcsDateTime {
  date: PlainDate;
  hour: number;
  minute: number;
  allDay: boolean;
}

function parseIcsDateTime(value: string, params: string): IcsDateTime | null {
  const trimmed = value.trim();

  // 全天事件：VALUE=DATE 或纯 8 位日期
  const dateOnly = /^(\d{4})(\d{2})(\d{2})$/.exec(trimmed);
  if (dateOnly && (params.includes("VALUE=DATE") || trimmed.length === 8)) {
    return {
      date: { year: Number(dateOnly[1]), month: Number(dateOnly[2]), day: Number(dateOnly[3]) },
      hour: 0,
      minute: 0,
      allDay: true,
    };
  }

  // 带时刻，末尾的 Z 表示 UTC
  const withTime = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(Z)?$/.exec(trimmed);
  if (!withTime) {
    return null;
  }

  const utc = Boolean(withTime[7]);
  if (utc) {
    // ICS 里的 UTC 时刻是真实时间，按本地时区换算成用户看到的日期和时刻
    const moment = new Date(
      Date.UTC(
        Number(withTime[1]),
        Number(withTime[2]) - 1,
        Number(withTime[3]),
        Number(withTime[4]),
        Number(withTime[5]),
        Number(withTime[6] ?? "0"),
      ),
    );
    return {
      date: { year: moment.getFullYear(), month: moment.getMonth() + 1, day: moment.getDate() },
      hour: moment.getHours(),
      minute: moment.getMinutes(),
      allDay: false,
    };
  }

  // 不带 Z 的本地时间：按墙上时间直接采用，不做时区换算
  return {
    date: { year: Number(withTime[1]), month: Number(withTime[2]), day: Number(withTime[3]) },
    hour: Number(withTime[4]),
    minute: Number(withTime[5]),
    allDay: false,
  };
}

function expandOccurrences(
  start: IcsDateTime,
  rrule: string,
  exdate: string,
  windowStart: PlainDate,
  windowEnd: PlainDate,
): IcsDateTime[] {
  const excluded = new Set(parseExdates(exdate));
  const base: IcsDateTime = { ...start };

  if (!rrule) {
    return excluded.has(dateKey(base.date)) ? [] : [base];
  }

  const rule = parseRRule(rrule);
  const frequency = rule.FREQ;
  const interval = Math.max(1, Number(rule.INTERVAL ?? "1") || 1);
  const count = rule.COUNT ? Math.min(Number(rule.COUNT) || MAX_OCCURRENCES, MAX_OCCURRENCES) : MAX_OCCURRENCES;
  const until = rule.UNTIL ? parseIcsDateTime(rule.UNTIL, "") : null;

  // 只支持基础频率。遇到不认识的规则时降级为单次事件，而不是整条丢弃。
  if (!frequency || !["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].includes(frequency)) {
    return excluded.has(dateKey(base.date)) ? [] : [base];
  }

  const results: IcsDateTime[] = [];
  let cursor = base.date;
  let generated = 0;
  let guard = 0;

  while (generated < count && guard < MAX_OCCURRENCES * 2) {
    guard += 1;

    if (isAfter(cursor, windowEnd)) {
      break;
    }
    if (until && isAfter(cursor, until.date)) {
      break;
    }

    if (!isBefore(cursor, windowStart)) {
      generated += 1;
      if (!excluded.has(dateKey(cursor))) {
        results.push({ ...base, date: cursor });
      }
    }

    cursor = step(cursor, frequency, interval);
  }

  return results;
}

function parseRRule(rrule: string): Record<string, string> {
  const result: Record<string, string> = {};
  const first = rrule.split(",")[0];
  for (const part of first.split(";")) {
    const [key, value] = part.split("=");
    if (key && value) {
      result[key.trim().toUpperCase()] = value.trim();
    }
  }
  return result;
}

function parseExdates(value: string): string[] {
  return value
    .split(",")
    .map((entry) => parseIcsDateTime(entry, ""))
    .filter((entry): entry is IcsDateTime => entry !== null)
    .map((entry) => dateKey(entry.date));
}

function step(date: PlainDate, frequency: string, interval: number): PlainDate {
  if (frequency === "DAILY") {
    return addDays(date, interval);
  }
  if (frequency === "WEEKLY") {
    return addDays(date, interval * 7);
  }
  if (frequency === "MONTHLY") {
    return addMonthsClamped(date, interval);
  }
  return { ...date, year: date.year + interval };
}

function addMonthsClamped(date: PlainDate, delta: number): PlainDate {
  const targetMonthIndex = date.month - 1 + delta;
  const year = date.year + Math.floor(targetMonthIndex / 12);
  const month = ((targetMonthIndex % 12) + 12) % 12;
  const lastDay = new Date(year, month + 1, 0).getDate();
  return { year, month: month + 1, day: Math.min(date.day, lastDay) };
}

function isWithin(date: PlainDate, start: PlainDate, end: PlainDate): boolean {
  return !isBefore(date, start) && !isAfter(date, end);
}

function isBefore(a: PlainDate, b: PlainDate): boolean {
  return toComparable(a) < toComparable(b);
}

function isAfter(a: PlainDate, b: PlainDate): boolean {
  return toComparable(a) > toComparable(b);
}

function toComparable(date: PlainDate): number {
  return date.year * 10000 + date.month * 100 + date.day;
}

function daysBetween(from: PlainDate, to: PlainDate): number {
  const a = new Date(from.year, from.month - 1, from.day).getTime();
  const b = new Date(to.year, to.month - 1, to.day).getTime();
  return Math.round((b - a) / 86400000);
}

/**
 * 事件覆盖多少天。
 *
 * 按 RFC 5545，全天事件的 DTEND 是排他的（DTSTART 9/17、DTEND 9/20 表示 17–19 日），
 * 带时刻事件的 DTEND 则是包含的终点时刻。两种写法都要还原成正确的天数。
 */
function getSpanDays(start: IcsDateTime, end: IcsDateTime): number {
  if (start.allDay || end.allDay) {
    return Math.max(1, daysBetween(start.date, end.date));
  }
  return Math.max(1, daysBetween(start.date, end.date) + 1);
}

function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** ICS 文本转义：\, \; \n \\ */
function unescapeText(value: string): string {
  return value
    .replace(/\\n/gi, " ")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();
}
