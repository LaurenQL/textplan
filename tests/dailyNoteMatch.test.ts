import { describe, expect, it } from "vitest";

import { parseDateFromFileName } from "../src/core/fileName";
import { matchDailyNote } from "../src/core/dailyNoteMatch";
import type { PlainDate } from "../src/core/date";

const date: PlainDate = { year: 2026, month: 9, day: 17 };

function formatWith(format: string) {
  return (target: PlainDate) =>
    format
      .replaceAll("YYYY", String(target.year))
      .replaceAll("MM", String(target.month).padStart(2, "0"))
      .replaceAll("DD", String(target.day).padStart(2, "0"));
}

describe("parseDateFromFileName", () => {
  it("按 YYYYMMDD 反推日期", () => {
    expect(parseDateFromFileName("YYYYMMDD", "20260917.md")).toEqual(date);
  });

  it("支持带分隔符和字面量的格式", () => {
    expect(parseDateFromFileName("YYYY-MM-DD", "2026-09-17.md")).toEqual(date);
    expect(parseDateFromFileName("[日记] YYYY[年]MM[月]DD[日]", "日记 2026年09月17日.md")).toEqual(date);
    expect(parseDateFromFileName("YYYY.MM.DD", "2026.09.17.md")).toEqual(date);
  });

  it("文件名不符合格式时返回 null", () => {
    expect(parseDateFromFileName("YYYYMMDD", "2026-09-17.md")).toBeNull();
    expect(parseDateFromFileName("YYYYMMDD", "开会记录.md")).toBeNull();
  });

  it("拦掉不存在的日期", () => {
    expect(parseDateFromFileName("YYYYMMDD", "20260230.md")).toBeNull();
    expect(parseDateFromFileName("YYYYMMDD", "20261301.md")).toBeNull();
  });

  it("格式串缺少年/月/日时返回 null", () => {
    expect(parseDateFromFileName("YYYY", "2026.md")).toBeNull();
  });
});

describe("matchDailyNote", () => {
  it("配置目录下的精确路径最优先", () => {
    const input = {
      paths: ["textplan/20260917.md", "daily/20260917.md"],
      date,
      expectedPath: "textplan/20260917.md",
      formatFileName: formatWith("YYYYMMDD"),
      fileNameFormat: "YYYYMMDD",
    };
    const match = matchDailyNote(input);
    expect(match?.path).toBe("textplan/20260917.md");
    expect(match?.location).toBe("in-directory");
    expect(match?.alternatives).toEqual([]);
  });

  it("其他插件的日记装在别处时，复用同一份文件而不是新建", () => {
    // Daily Notes 装在 vault 根目录，TextPlan 配的目录是 textplan/
    const input = {
      paths: ["20260917.md", "20260916.md"],
      date,
      expectedPath: "textplan/20260917.md",
      formatFileName: formatWith("YYYYMMDD"),
      fileNameFormat: "YYYYMMDD",
    };
    const match = matchDailyNote(input);
    expect(match?.path).toBe("20260917.md");
    expect(match?.location).toBe("elsewhere");
  });

  it("同目录只有一份时，alternatives 为空", () => {
    const input = {
      paths: ["notes/20260917.md", "notes/20260916.md"],
      date,
      expectedPath: "notes/20260917.md",
      formatFileName: formatWith("YYYYMMDD"),
      fileNameFormat: "YYYYMMDD",
    };
    const match = matchDailyNote(input);
    expect(match?.path).toBe("notes/20260917.md");
    expect(match?.alternatives).toEqual([]);
  });

  it("找不到任何一天的文件时返回 null，交由调用方新建", () => {
    const input = {
      paths: ["20260916.md", "开会记录.md"],
      date,
      expectedPath: "textplan/20260917.md",
      formatFileName: formatWith("YYYYMMDD"),
      fileNameFormat: "YYYYMMDD",
    };
    expect(matchDailyNote(input)).toBeNull();
  });

  it("别的目录里同一天的目录会一并列出", () => {
    const input = {
      paths: ["journal/20260917.md", "archive/20260917.md"],
      date,
      expectedPath: "textplan/20260917.md",
      formatFileName: formatWith("YYYYMMDD"),
      fileNameFormat: "YYYYMMDD",
    };
    const match = matchDailyNote(input);
    expect(match?.location).toBe("elsewhere");
    // 按路径字母序排列，archive < journal，所以 archive 是主匹配，journal 在 alternatives
    expect(match?.path).toBe("archive/20260917.md");
    expect(match?.alternatives.map((item) => item.path)).toEqual(["journal/20260917.md"]);
  });
});
