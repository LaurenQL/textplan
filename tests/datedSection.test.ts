import { describe, expect, it } from "vitest";
import { parseDatedSections } from "../src/core/datedSection";

const markdownSyntax = { mode: "markdown" as const };
const asteriskSyntax = { mode: "asterisk" as const };

describe("dated sections", () => {
  it("groups todos under ### YYYY-MM-DD headings", () => {
    const content = [
      "- [ ] 今天的任务",
      "",
      "### 2026-11-20",
      "- [ ] 交房租",
      "- [ ] 预约牙医",
      "",
      "### 2026-11-25",
      "- [ ] 出差",
    ].join("\n");

    const { byDate } = parseDatedSections(content, markdownSyntax);

    expect([...byDate.keys()]).toEqual(["2026-11-20", "2026-11-25"]);
    expect(byDate.get("2026-11-20")?.map((todo) => todo.text)).toEqual(["交房租", "预约牙医"]);
    expect(byDate.get("2026-11-25")?.map((todo) => todo.text)).toEqual(["出差"]);
  });

  it("reports the line numbers that belong to dated headings", () => {
    const content = ["- [ ] 今天的任务", "", "### 2026-11-20", "- [ ] 交房租"].join("\n");

    const { lineNumbers } = parseDatedSections(content, markdownSyntax);

    // 第 0 行属于文件自己那天，不该出现在结果里
    expect([...lineNumbers]).toEqual([3]);
  });

  it("stops grouping at the next non-date heading", () => {
    const content = [
      "### 2026-11-20",
      "- [ ] 交房租",
      "## 备注",
      "- [ ] 这行不属于任何日期",
    ].join("\n");

    const { byDate } = parseDatedSections(content, markdownSyntax);

    expect(byDate.get("2026-11-20")?.map((todo) => todo.text)).toEqual(["交房租"]);
  });

  it("ignores the Done section and keeps its todos out of any date", () => {
    const content = [
      "### 2026-11-20",
      "- [ ] 交房租",
      "",
      "## Done",
      "### 2026-11-21",
      "- [x] 已经归档的",
    ].join("\n");

    const { byDate } = parseDatedSections(content, markdownSyntax);

    expect([...byDate.keys()]).toEqual(["2026-11-20"]);
  });

  it("works in asterisk mode", () => {
    const content = ["### 2026-11-20", "* 交房租", "* ✓ 已完成", "* x 已放弃"].join("\n");

    const { byDate } = parseDatedSections(content, asteriskSyntax);

    expect(byDate.get("2026-11-20")?.map((todo) => ({ text: todo.text, state: todo.state }))).toEqual([
      { text: "交房租", state: "open" },
      { text: "已完成", state: "done" },
      { text: "已放弃", state: "abandoned" },
    ]);
  });

  it("rejects malformed dates", () => {
    const content = ["### 2026-11-20-extra", "- [ ] 不该被分组", "", "### 2026/11/20", "- [ ] 也不该"].join("\n");

    const { byDate } = parseDatedSections(content, markdownSyntax);

    expect(byDate.size).toBe(0);
  });
});
