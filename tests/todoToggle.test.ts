import { describe, expect, it } from "vitest";
import { toggleTodoLine, toggleTodoLines } from "../src/core/todoToggle";

const asteriskSyntax = { mode: "asterisk" as const };
const markdownSyntax = { mode: "markdown" as const };
const customSyntax = { mode: "custom" as const, customOpen: ">>", customDone: "✓✓" };

describe("todo toggle", () => {
  it("cycles asterisk todos through open → done → abandoned → open", () => {
    const options = {
      recordCompletionTime: false,
      doneDate: "2026-08-29",
      syntaxConfig: asteriskSyntax,
    };

    expect(toggleTodoLine("* buy milk", options)).toBe("* ✓ buy milk");
    expect(toggleTodoLine("* ✓ buy milk", options)).toBe("* x buy milk");
    expect(toggleTodoLine("* x buy milk", options)).toBe("* buy milk");
  });

  it("cycles markdown native todos through open → done → abandoned → open", () => {
    const options = {
      recordCompletionTime: false,
      doneDate: "2026-08-29",
      syntaxConfig: markdownSyntax,
    };

    expect(toggleTodoLine("- [ ] buy milk", options)).toBe("- [x] buy milk");
    expect(toggleTodoLine("- [x] buy milk", options)).toBe("- [-] buy milk");
    expect(toggleTodoLine("- [-] buy milk", options)).toBe("- [ ] buy milk");
  });

  it("cycles custom syntax todos, deriving the abandoned marker from the done marker", () => {
    const options = {
      recordCompletionTime: false,
      doneDate: "2026-08-29",
      syntaxConfig: customSyntax,
    };

    expect(toggleTodoLine(">> buy milk", options)).toBe("✓✓ buy milk");
    expect(toggleTodoLine("✓✓ buy milk", options)).toBe("✓✓x buy milk");
    expect(toggleTodoLine("✓✓x buy milk", options)).toBe(">> buy milk");
  });

  it("drops the done stamp when leaving the done state", () => {
    const options = {
      recordCompletionTime: true,
      doneDate: "2026-08-29",
      syntaxConfig: asteriskSyntax,
    };

    expect(toggleTodoLine("*buy milk", options)).toBe("* ✓ buy milk @done(2026-08-29)");
    // 已完成 → 已放弃：放弃的任务不该留下完成时间
    expect(toggleTodoLine("* ✓ buy milk @done(2026-08-29)", options)).toBe("* x buy milk");
  });

  it("toggles selected todo lines and ignores normal text", () => {
    const content = "- note\n* first\n  * second\n";
    const next = toggleTodoLines(content, 0, 2, {
      recordCompletionTime: false,
      doneDate: "2026-08-29",
      syntaxConfig: asteriskSyntax,
    });

    expect(next).toBe("- note\n* ✓ first\n  * ✓ second\n");
  });
});
