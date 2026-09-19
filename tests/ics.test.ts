import { describe, expect, it } from "vitest";

import { dateKey, parseIcs } from "../src/core/ics";
import type { PlainDate } from "../src/core/date";

const windowStart: PlainDate = { year: 2026, month: 9, day: 1 };
const windowEnd: PlainDate = { year: 2026, month: 9, day: 30 };

function wrap(...lines: string[]): string {
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT", ...lines, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
}

function eventsOn(ics: string, date: PlainDate) {
  return parseIcs(ics, "测试日历", windowStart, windowEnd).eventsByDate.get(dateKey(date)) ?? [];
}

describe("parseIcs", () => {
  it("解析带时刻的本地事件", () => {
    const ics = wrap("DTSTART:20260917T093000", "DTEND:20260917T103000", "SUMMARY:站会", "LOCATION:会议室 A");
    const events = eventsOn(ics, { year: 2026, month: 9, day: 17 });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      allDay: false,
      startTime: "09:30",
      endTime: "10:30",
      summary: "站会",
      location: "会议室 A",
      sourceName: "测试日历",
    });
  });

  it("解析全天事件（VALUE=DATE）", () => {
    const ics = wrap("DTSTART;VALUE=DATE:20260917", "SUMMARY:假期");
    const events = eventsOn(ics, { year: 2026, month: 9, day: 17 });
    expect(events).toHaveLength(1);
    expect(events[0].allDay).toBe(true);
    expect(events[0].startTime).toBe("");
  });

  it("把 UTC 时刻换算成同一个真实时刻", () => {
    // 2026-09-17T01:30Z 也就是本地时区的同一瞬间，日期不应漂移
    const ics = wrap("DTSTART:20260917T013000Z", "DTEND:20260917T023000Z", "SUMMARY:跨时区会议");
    const parsed = parseIcs(ics, "测试日历", windowStart, windowEnd);
    const all = [...parsed.eventsByDate.values()].flat();
    expect(all).toHaveLength(1);

    const expected = new Date(Date.UTC(2026, 8, 17, 1, 30));
    expect(all[0].date).toEqual({
      year: expected.getFullYear(),
      month: expected.getMonth() + 1,
      day: expected.getDate(),
    });
    expect(all[0].startTime).toBe(
      `${String(expected.getHours()).padStart(2, "0")}:${String(expected.getMinutes()).padStart(2, "0")}`,
    );
  });

  it("跨天事件每天各展开一条", () => {
    const ics = wrap("DTSTART;VALUE=DATE:20260917", "DTEND;VALUE=DATE:20260920", "SUMMARY:出差");
    const parsed = parseIcs(ics, "测试日历", windowStart, windowEnd);
    const days = [...parsed.eventsByDate.keys()].sort();
    expect(days).toEqual(["2026-9-17", "2026-9-18", "2026-9-19"]);
  });

  it("按 RRULE 展开每周重复", () => {
    const ics = wrap("DTSTART:20260907T100000", "DTEND:20260907T110000", "SUMMARY:周会", "RRULE:FREQ=WEEKLY;COUNT=3");
    const dates = [...parseIcs(ics, "测试日历", windowStart, windowEnd).eventsByDate.keys()].sort();
    expect(dates).toEqual(["2026-9-14", "2026-9-21", "2026-9-7"]);
  });

  it("EXDATE 排除掉的日期不再出现", () => {
    const ics = wrap(
      "DTSTART:20260907T100000",
      "DTEND:20260907T110000",
      "SUMMARY:周会",
      "RRULE:FREQ=WEEKLY;COUNT=3",
      "EXDATE:20260914T100000",
    );
    const dates = [...parseIcs(ics, "测试日历", windowStart, windowEnd).eventsByDate.keys()].sort();
    expect(dates).toEqual(["2026-9-21", "2026-9-7"]);
  });

  it("超出显示窗口的日期不返回", () => {
    const ics = wrap("DTSTART:20261101T100000", "DTEND:20261101T110000", "SUMMARY:下个月的事");
    const parsed = parseIcs(ics, "测试日历", windowStart, windowEnd);
    expect(parsed.eventsByDate.size).toBe(0);
  });

  it("处理折行、转义和缺失 SUMMARY", () => {
    const ics = wrap("DTSTART:20260917T093000", "SUMMARY:一个很长的标题会在这里换", " 行继续");
    const events = eventsOn(ics, { year: 2026, month: 9, day: 17 });
    expect(events[0].summary).toBe("一个很长的标题会在这里换行继续");

    const noSummary = wrap("DTSTART:20260917T093000");
    expect(eventsOn(noSummary, { year: 2026, month: 9, day: 17 })[0].summary).toBe("(untitled)");
  });

  it("同一天内全天事件排在定时事件之前", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "DTSTART:20260917T140000",
      "SUMMARY:下午的会",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "DTSTART;VALUE=DATE:20260917",
      "SUMMARY:纪念日",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const events = eventsOn(ics, { year: 2026, month: 9, day: 17 });
    expect(events.map((event) => event.summary)).toEqual(["纪念日", "下午的会"]);
  });
});
