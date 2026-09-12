import { describe, expect, it } from "vitest";
import { toggleTodoLine, toggleTodoLines } from "../src/core/todoToggle";

const asteriskSyntax = { mode: "asterisk" as const };
const markdownSyntax = { mode: "markdown" as const };

describe("todo toggle", () => {
  it("toggles asterisk todos", () => {
    expect(
      toggleTodoLine("* buy milk", {
        recordCompletionTime: false,
        doneDate: "2026-08-29",
        syntaxConfig: asteriskSyntax,
      }),
    ).toBe("* ✓ buy milk");

    expect(
      toggleTodoLine("* ✓ buy milk", {
        recordCompletionTime: false,
        doneDate: "2026-08-29",
        syntaxConfig: asteriskSyntax,
      }),
    ).toBe("* buy milk");
  });

  it("toggles markdown native todos", () => {
    expect(
      toggleTodoLine("- [ ] buy milk", {
        recordCompletionTime: false,
        doneDate: "2026-08-29",
        syntaxConfig: markdownSyntax,
      }),
    ).toBe("- [x] buy milk");

    expect(
      toggleTodoLine("- [x] buy milk", {
        recordCompletionTime: false,
        doneDate: "2026-08-29",
        syntaxConfig: markdownSyntax,
      }),
    ).toBe("- [ ] buy milk");
  });

  it("toggles compact unfinished todos with done stamps", () => {
    expect(
      toggleTodoLine("*buy milk", {
        recordCompletionTime: true,
        doneDate: "2026-08-29",
        syntaxConfig: asteriskSyntax,
      }),
    ).toBe("* ✓ buy milk @done(2026-08-29)");

    expect(
      toggleTodoLine("* ✓ buy milk @done(2026-08-29)", {
        recordCompletionTime: true,
        doneDate: "2026-08-29",
        syntaxConfig: asteriskSyntax,
      }),
    ).toBe("* buy milk");
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
