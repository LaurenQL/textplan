import { describe, expect, it } from "vitest";
import { getUnfinishedTodos, parseTodos } from "../src/core/todo";

const asteriskSyntax = { mode: "asterisk" as const };
const markdownSyntax = { mode: "markdown" as const };

describe("todo parser", () => {
  it("parses asterisk todos and nested todos", () => {
    const todos = parseTodos("* parent\n  * nested\n*compact\n*  spaced\n- note\n* ✓ done", asteriskSyntax);

    expect(todos.map((todo) => ({ text: todo.text, completed: todo.completed, indent: todo.indent }))).toEqual([
      { text: "parent", completed: false, indent: "" },
      { text: "nested", completed: false, indent: "  " },
      { text: "compact", completed: false, indent: "" },
      { text: "spaced", completed: false, indent: "" },
      { text: "done", completed: true, indent: "" },
    ]);
  });

  it("parses legacy asterisk-checkbox completed markers", () => {
    const todos = parseTodos("*[x] legacy\n* ✓ new\n* [x] mkdown checkbox", asteriskSyntax);

    expect(todos.map((todo) => ({ text: todo.text, completed: todo.completed }))).toEqual([
      { text: "legacy", completed: true },
      { text: "new", completed: true },
    ]);
  });

  it("parses markdown native todos", () => {
    const todos = parseTodos("- [ ] open\n  - [x] done nested\n- [x] done", markdownSyntax);

    expect(todos.map((todo) => ({ text: todo.text, completed: todo.completed, indent: todo.indent }))).toEqual([
      { text: "open", completed: false, indent: "" },
      { text: "done nested", completed: true, indent: "  " },
      { text: "done", completed: true, indent: "" },
    ]);
  });

  it("does not parse empty task markers", () => {
    expect(parseTodos("*\n*   \n*[x]", asteriskSyntax)).toEqual([]);
  });

  it("returns unfinished todos outside Done only", () => {
    const todos = getUnfinishedTodos("* open\n*[x] done\n\n## Done\n* archived", asteriskSyntax);

    expect(todos.map((todo) => todo.text)).toEqual(["open"]);
  });
});
