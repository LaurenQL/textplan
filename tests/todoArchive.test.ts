import { describe, expect, it } from "vitest";
import { archiveCompletedTodos } from "../src/core/todoArchive";

const asteriskSyntax = { mode: "asterisk" as const };
const markdownSyntax = { mode: "markdown" as const };

describe("todo archive", () => {
  it("moves completed asterisk todos to Done", () => {
    const result = archiveCompletedTodos("- Text\n* todo\n* ✓ Todo\n* ✓ todo", asteriskSyntax);

    expect(result.archivedCount).toBe(2);
    expect(result.content).toBe("- Text\n* todo\n\n## Done\n\n* ✓ Todo\n* ✓ todo");
  });

  it("appends to an existing Done section without duplicating archived todos", () => {
    const result = archiveCompletedTodos("* ✓ new\n\n## Done\n\n* ✓ old", asteriskSyntax);

    expect(result.archivedCount).toBe(1);
    // Archived items insert immediately after the ## Done heading; the existing blank
    // line that was already there ends up after the newly inserted items.
    expect(result.content).toBe("\n## Done\n* ✓ new\n\n* ✓ old");

    const second = archiveCompletedTodos(result.content, asteriskSyntax);
    expect(second.archivedCount).toBe(0);
    expect(second.content).toBe(result.content);
  });

  it("archives completed Markdown checkbox todos in asterisk mode for cross-mode compatibility", () => {
    const result = archiveCompletedTodos("* open\n- [x] done markdown\n* ✓ done asterisk", asteriskSyntax);

    expect(result.archivedCount).toBe(2);
    expect(result.content).toBe("* open\n\n## Done\n\n- [x] done markdown\n* ✓ done asterisk");
  });

  it("archives completed todos in markdown mode", () => {
    const result = archiveCompletedTodos("- [ ] open\n- [x] done @done(2026-08-29)", markdownSyntax);

    expect(result.archivedCount).toBe(1);
    expect(result.content).toBe("- [ ] open\n\n## Done\n\n- [x] done @done(2026-08-29)");
  });

  // Bug #2: completed todos that are in a section AFTER the Done block were
  // skipped by the old `index < doneStartIndex` guard. The Done block ends at
  // the next `##` heading, so todos in that next section are outside Done.
  it("archives completed todos that appear in a section after the Done block (bug #2)", () => {
    const content = "- [ ] open\n\n## Done\n\n- [x] archived\n\n## Later\n\n- [x] stray completed in later section";
    const result = archiveCompletedTodos(content, markdownSyntax);

    expect(result.archivedCount).toBe(1);
    // the stray completed item should move into the Done block
    const lines = result.content.split("\n");
    const doneIdx = lines.findIndex((l) => /##\s+done/i.test(l));
    const strayIdx = lines.findIndex((l) => l.includes("stray completed in later section"));
    expect(strayIdx).toBeGreaterThan(doneIdx);
    // the ## Later heading should still be present
    expect(result.content).toContain("## Later");
  });

  // Bug #3: empty completed tasks like `- [x]` (no text) were not matched by the old \S.* regex
  it("archives empty-text completed markdown todos (bug #3)", () => {
    const result = archiveCompletedTodos("- [ ] open\n- [x]\n- [x] has text", markdownSyntax);

    expect(result.archivedCount).toBe(2);
    expect(result.content).toContain("- [x]");
    expect(result.content).toContain("- [x] has text");
    // both should be in the Done block
    const lines = result.content.split("\n");
    const doneIdx = lines.findIndex((l) => /##\s+done/i.test(l));
    const emptyIdx = lines.findIndex((l, i) => i > doneIdx && l === "- [x]");
    expect(emptyIdx).toBeGreaterThan(doneIdx);
  });

  // Done-block boundary: completed todos before a second heading that follows Done should
  // not be treated as Done-block members — they come from a different section.
  it("does not archive todos already inside the Done block", () => {
    const content = "- [ ] open\n\n## Done\n\n- [x] archived before\n\n## Notes\n\n- [x] in notes";
    // in notes section — should be archived since it's outside the Done block
    const result = archiveCompletedTodos(content, markdownSyntax);

    expect(result.archivedCount).toBe(1);
    expect(result.content).toContain("- [x] in notes");
    // the original Done entry should still be there
    expect(result.content).toContain("- [x] archived before");
  });

  // 三态模型：放弃不是完成，不该进 Done 归档区（PRD 6.4）
  it("放弃的星号任务留在原位置，不进 Done", () => {
    const result = archiveCompletedTodos("* open\n* ✓ done\n* x abandoned", asteriskSyntax);

    expect(result.archivedCount).toBe(1);
    expect(result.content).toBe("* open\n* x abandoned\n\n## Done\n\n* ✓ done");
  });

  it("放弃的 Markdown 任务留在原位置，不进 Done", () => {
    const result = archiveCompletedTodos("- [ ] open\n- [x] done\n- [-] abandoned", markdownSyntax);

    expect(result.archivedCount).toBe(1);
    expect(result.content).toBe("- [ ] open\n- [-] abandoned\n\n## Done\n\n- [x] done");
  });

  it("整篇只有放弃任务时，不创建 Done 区块", () => {
    const content = "- [ ] open\n- [-] abandoned";
    const result = archiveCompletedTodos(content, markdownSyntax);

    expect(result.archivedCount).toBe(0);
    expect(result.content).toBe(content);
    expect(result.content).not.toContain("## Done");
  });

  it("跨语法模式下放弃任务同样不被归档", () => {
    // markdown 模式里遇到星号语法的放弃任务，也不该归档
    const result = archiveCompletedTodos("- [ ] open\n* x abandoned asterisk\n- [x] done", markdownSyntax);

    expect(result.archivedCount).toBe(1);
    expect(result.content).toContain("* x abandoned asterisk");
    const lines = result.content.split("\n");
    const doneIdx = lines.findIndex((line) => /##\s+done/i.test(line));
    const abandonedIdx = lines.findIndex((line) => line.includes("abandoned asterisk"));
    expect(abandonedIdx).toBeLessThan(doneIdx);
  });
});
