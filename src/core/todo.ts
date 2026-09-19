import type { TodoState, TodoSyntaxConfig } from "../settings/types";

export interface ParsedTodo {
  line: string;
  lineNumber: number;
  indent: string;
  marker: string;
  text: string;
  state: TodoState;
  /** 便捷派生：已完成或已放弃都算「已结束」。 */
  completed: boolean;
  inDoneSection: boolean;
}

export type TodoLineKind = "textplan" | "markdown-checkbox";

const DONE_HEADING_PATTERN = /^\s*##\s+Done\s*$/i;

// Markdown 原生模式（文本部分允许为空，兼容 `- [x]` 这类空任务）
const MARKDOWN_OPEN_PATTERN = /^(\s*)-\s+\[\s\]\s*(.*)$/;
const MARKDOWN_DONE_PATTERN = /^(\s*)-\s+\[x\]\s*(.*)$/i;
const MARKDOWN_ABANDONED_PATTERN = /^(\s*)-\s+\[-\]\s*(.*)$/;

// 星号模式
const ASTERISK_DONE_PATTERN = /^(\s*)\*\s*✓\s*(\S.*)$/;
const ASTERISK_LEGACY_DONE_PATTERN = /^(\s*)\*\[x\]\s*(\S.*)$/i;
const ASTERISK_ABANDONED_PATTERN = /^(\s*)\*\s*x\s+(\S.*)$/;
// 未完成：排除 `*[x]` / `*[ ]` 复选框、`* ✓` 已完成、`* x ` 已放弃
const ASTERISK_OPEN_PATTERN = /^(\s*)\*(?!\s*\[[ xX]\])(?!\s*✓)(?!\s*x\s)(?!\s+x\s)\s*(\S.*)$/;

export function parseTodos(content: string, syntaxConfig: TodoSyntaxConfig): ParsedTodo[] {
  const lines = splitLines(content);
  const todos: ParsedTodo[] = [];
  let inDoneSection = false;

  lines.forEach((line, index) => {
    if (DONE_HEADING_PATTERN.test(line)) {
      inDoneSection = true;
      return;
    }

    const todo = parseTodoLine(line, index, inDoneSection, syntaxConfig);
    if (todo) {
      todos.push(todo);
    }
  });

  return todos;
}

export function parseTodoLine(
  line: string,
  lineNumber: number,
  inDoneSection: boolean,
  syntaxConfig: TodoSyntaxConfig,
): ParsedTodo | null {
  if (syntaxConfig.mode === "markdown") {
    return parseMarkdownTodoLine(line, lineNumber, inDoneSection);
  }

  if (syntaxConfig.mode === "asterisk") {
    return parseAsteriskTodoLine(line, lineNumber, inDoneSection);
  }

  if (syntaxConfig.mode === "custom" && syntaxConfig.customOpen && syntaxConfig.customDone) {
    return parseCustomTodoLine(line, lineNumber, inDoneSection, syntaxConfig);
  }

  return null;
}

function makeTodo(
  line: string,
  lineNumber: number,
  indent: string,
  marker: string,
  rawText: string,
  state: TodoState,
  inDoneSection: boolean,
): ParsedTodo {
  return {
    line,
    lineNumber,
    indent,
    marker,
    text: rawText.trim(),
    state,
    completed: state !== "open",
    inDoneSection,
  };
}

function parseMarkdownTodoLine(line: string, lineNumber: number, inDoneSection: boolean): ParsedTodo | null {
  const abandonedMatch = MARKDOWN_ABANDONED_PATTERN.exec(line);
  if (abandonedMatch) {
    return makeTodo(line, lineNumber, abandonedMatch[1], "- [-]", abandonedMatch[2], "abandoned", inDoneSection);
  }

  const doneMatch = MARKDOWN_DONE_PATTERN.exec(line);
  if (doneMatch) {
    return makeTodo(line, lineNumber, doneMatch[1], "- [x]", doneMatch[2], "done", inDoneSection);
  }

  const openMatch = MARKDOWN_OPEN_PATTERN.exec(line);
  if (openMatch) {
    return makeTodo(line, lineNumber, openMatch[1], "- [ ]", openMatch[2], "open", inDoneSection);
  }

  return null;
}

function parseAsteriskTodoLine(line: string, lineNumber: number, inDoneSection: boolean): ParsedTodo | null {
  const doneMatch = ASTERISK_DONE_PATTERN.exec(line);
  if (doneMatch) {
    return makeTodo(line, lineNumber, doneMatch[1], "* ✓", doneMatch[2], "done", inDoneSection);
  }

  const legacyDoneMatch = ASTERISK_LEGACY_DONE_PATTERN.exec(line);
  if (legacyDoneMatch) {
    return makeTodo(line, lineNumber, legacyDoneMatch[1], "*[x]", legacyDoneMatch[2], "done", inDoneSection);
  }

  const abandonedMatch = ASTERISK_ABANDONED_PATTERN.exec(line);
  if (abandonedMatch) {
    return makeTodo(line, lineNumber, abandonedMatch[1], "* x", abandonedMatch[2], "abandoned", inDoneSection);
  }

  const openMatch = ASTERISK_OPEN_PATTERN.exec(line);
  if (openMatch) {
    return makeTodo(line, lineNumber, openMatch[1], "*", openMatch[2], "open", inDoneSection);
  }

  return null;
}

function parseCustomTodoLine(
  line: string,
  lineNumber: number,
  inDoneSection: boolean,
  syntaxConfig: TodoSyntaxConfig,
): ParsedTodo | null {
  const customOpen = syntaxConfig.customOpen as string;
  const customDone = syntaxConfig.customDone as string;

  const abandonedMarker = getCustomAbandonedMarker(syntaxConfig);
  if (abandonedMarker) {
    const abandonedMatch = new RegExp(`^(\\s*)${escapeRegex(abandonedMarker)}\\s+(\\S.*)$`).exec(line);
    if (abandonedMatch) {
      return makeTodo(line, lineNumber, abandonedMatch[1], abandonedMarker, abandonedMatch[2], "abandoned", inDoneSection);
    }
  }

  const doneMatch = new RegExp(`^(\\s*)${escapeRegex(customDone)}\\s+(\\S.*)$`).exec(line);
  if (doneMatch) {
    return makeTodo(line, lineNumber, doneMatch[1], customDone, doneMatch[2], "done", inDoneSection);
  }

  const openMatch = new RegExp(`^(\\s*)${escapeRegex(customOpen)}\\s+(\\S.*)$`).exec(line);
  if (openMatch) {
    return makeTodo(line, lineNumber, openMatch[1], customOpen, openMatch[2], "open", inDoneSection);
  }

  return null;
}

/** 自定义模式的放弃标记：用户显式设置，否则由「已完成标记 + x」派生。 */
export function getCustomAbandonedMarker(syntaxConfig: TodoSyntaxConfig): string {
  if (syntaxConfig.mode !== "custom" || !syntaxConfig.customDone) {
    return "";
  }
  const explicit = syntaxConfig.customAbandoned?.trim();
  if (explicit) {
    return explicit;
  }
  return syntaxConfig.customDone.includes("x") ? syntaxConfig.customDone : `${syntaxConfig.customDone}x`;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// 为归档功能提供的跨语法模式已完成任务识别
export function parseCompletedTodoAnyMode(line: string, lineNumber: number, inDoneSection: boolean): ParsedTodo | null {
  // Markdown 原生
  const markdownMatch = MARKDOWN_DONE_PATTERN.exec(line);
  if (markdownMatch) {
    return makeTodo(line, lineNumber, markdownMatch[1], "- [x]", markdownMatch[2], "done", inDoneSection);
  }

  // 星号模式
  const asteriskMatch = ASTERISK_DONE_PATTERN.exec(line);
  if (asteriskMatch) {
    return makeTodo(line, lineNumber, asteriskMatch[1], "* ✓", asteriskMatch[2], "done", inDoneSection);
  }

  const legacyMatch = ASTERISK_LEGACY_DONE_PATTERN.exec(line);
  if (legacyMatch) {
    return makeTodo(line, lineNumber, legacyMatch[1], "*[x]", legacyMatch[2], "done", inDoneSection);
  }

  return null;
}

/** 跨语法模式的已放弃任务识别，让「放弃」在任意语法模式下都能被日历和装饰认出来。 */
export function parseAbandonedTodoAnyMode(line: string, lineNumber: number, inDoneSection: boolean): ParsedTodo | null {
  const markdownMatch = MARKDOWN_ABANDONED_PATTERN.exec(line);
  if (markdownMatch) {
    return makeTodo(line, lineNumber, markdownMatch[1], "- [-]", markdownMatch[2], "abandoned", inDoneSection);
  }

  const asteriskMatch = ASTERISK_ABANDONED_PATTERN.exec(line);
  if (asteriskMatch) {
    return makeTodo(line, lineNumber, asteriskMatch[1], "* x", asteriskMatch[2], "abandoned", inDoneSection);
  }

  return null;
}

/**
 * 日历用：未完成的任务。已放弃的任务不再出现在日历里 —— 既然已经放弃，
 * 就不该继续占着当天的待办位置。
 */
export function getUnfinishedTodos(content: string, syntaxConfig: TodoSyntaxConfig): ParsedTodo[] {
  return parseTodos(content, syntaxConfig).filter((todo) => todo.state === "open" && !todo.inDoneSection);
}

export function splitLines(content: string): string[] {
  if (content.length === 0) {
    return [];
  }

  return content.replace(/\r?\n$/, "").split(/\r?\n/);
}

export function detectLineEnding(content: string): string {
  return content.includes("\r\n") ? "\r\n" : "\n";
}

export function hasTrailingLineEnding(content: string): boolean {
  return /\r?\n$/.test(content);
}

export function joinLines(lines: string[], lineEnding: string, trailingLineEnding: boolean): string {
  const joined = lines.join(lineEnding);
  return trailingLineEnding && joined.length > 0 ? `${joined}${lineEnding}` : joined;
}
