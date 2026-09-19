import { requestUrl } from "obsidian";
import { dateKey, parseIcs, type CalendarEvent } from "../core/ics";
import { addDays, type PlainDate } from "../core/date";
import type { IcsSource } from "../settings/types";

export interface IcsFetchResult {
  eventsByDate: Map<string, CalendarEvent[]>;
  /** 拉取或解析失败的订阅源名称，用于在日历上提示。 */
  errors: string[];
  /** 最近一次成功刷新的时间戳，0 表示还没成功过。 */
  fetchedAt: number;
}

const EMPTY_RESULT: IcsFetchResult = { eventsByDate: new Map(), errors: [], fetchedAt: 0 };

/** 缓存有效期：15 分钟内不重复拉取，避免频繁请求订阅地址。 */
const CACHE_TTL_MS = 15 * 60 * 1000;

interface CacheEntry {
  fetchedAt: number;
  events: CalendarEvent[];
}

/**
 * ICS 订阅拉取与解析。
 *
 * 用 Obsidian 的 requestUrl 而不是 fetch —— requestUrl 走主进程，不受渲染进程
 * CORS 限制，日历服务商的订阅地址基本都不带 CORS 头。
 */
export class IcsClient {
  private cache = new Map<string, CacheEntry>();
  private lastError: string[] = [];

  /** 清掉缓存，用于设置变更后强制重新拉取。 */
  invalidate(): void {
    this.cache.clear();
    this.lastError = [];
  }

  async fetchEvents(sources: IcsSource[], windowStart: PlainDate, windowEnd: PlainDate, force = false): Promise<IcsFetchResult> {
    const enabled = sources.filter((source) => source.enabled && source.url.trim().length > 0);
    if (enabled.length === 0) {
      return EMPTY_RESULT;
    }

    const errors: string[] = [];
    const windowKey = `${dateKey(windowStart)}..${dateKey(windowEnd)}`;
    let fetchedAt = 0;

    for (const source of enabled) {
      const cacheKey = `${source.id}|${source.url}|${windowKey}`;
      const cached = this.cache.get(cacheKey);
      const fresh = cached && !force && Date.now() - cached.fetchedAt < CACHE_TTL_MS;
      if (fresh && cached) {
        fetchedAt = Math.max(fetchedAt, cached.fetchedAt);
        continue;
      }

      try {
        const response = await requestUrl({
          url: source.url,
          method: "GET",
          headers: { Accept: "text/calendar, text/plain, */*" },
        });

        const parsed = parseIcs(response.text, source.name, windowStart, windowEnd);
        const events = flatten(parsed.eventsByDate);
        this.cache.set(cacheKey, { fetchedAt: Date.now(), events });
      } catch (error) {
        console.warn(`TextPlan: 拉取日历订阅失败 ${source.name}`, error);
        errors.push(source.name);
        // 拉取失败时沿用上一次的结果，好过让日历突然空掉
        if (cached) {
          fetchedAt = Math.max(fetchedAt, cached.fetchedAt);
        }
      }
      fetchedAt = Math.max(fetchedAt, Date.now());
    }

    const eventsByDate = new Map<string, CalendarEvent[]>();
    for (const source of enabled) {
      const cacheKey = `${source.id}|${source.url}|${windowKey}`;
      const cached = this.cache.get(cacheKey);
      if (!cached) {
        continue;
      }
      fetchedAt = Math.max(fetchedAt, cached.fetchedAt);
      for (const event of cached.events) {
        if (!isWithinWindow(event.date, windowStart, windowEnd)) {
          continue;
        }
        const key = dateKey(event.date);
        const list = eventsByDate.get(key);
        if (list) {
          list.push(event);
        } else {
          eventsByDate.set(key, [event]);
        }
      }
    }

    eventsByDate.forEach((list) => {
      list.sort((a, b) => {
        if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
        return a.startTime.localeCompare(b.startTime);
      });
    });

    this.lastError = errors;
    return { eventsByDate, errors, fetchedAt };
  }

  getLastErrors(): string[] {
    return this.lastError;
  }
}

function flatten(map: Map<string, CalendarEvent[]>): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  map.forEach((list) => events.push(...list));
  return events;
}

function isWithinWindow(date: PlainDate, start: PlainDate, end: PlainDate): boolean {
  const value = date.year * 10000 + date.month * 100 + date.day;
  const from = start.year * 10000 + start.month * 100 + start.day;
  const to = end.year * 10000 + end.month * 100 + end.day;
  return value >= from && value <= to;
}

/** 月视图需要覆盖 6 行 × 7 列，前后各留一周余量。 */
export function getMonthWindow(viewMonth: PlainDate): { start: PlainDate; end: PlainDate } {
  const monthStart = { year: viewMonth.year, month: viewMonth.month, day: 1 };
  return { start: addDays(monthStart, -7), end: addDays(monthStart, 44) };
}
