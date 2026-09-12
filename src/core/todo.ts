import type { TodoSyntaxConfig } from "../settings/types";

export interface ParsedTodo {
  line: string;
  lineNumber: number;
  indent: string;
  marker: string;
  text: string;
  completed: boolean;
  inDoneSection: boolean;
}

export type TodoLineKind = "textplan" | "markdown-checkbox";

const DONE_HEADING_PATTERN = /^\s*##\s+Done\s*$/i;

// Markdown 原生模式（文本部分允许为空，兼容 `- [x]` 这类空任务）
const MARKDOWN_OPEN_PATTERN = /^(\s*)-\s+\[\s\]\s*(.*)$/;
const MARKDOWN_DONE_PATTERN = /^(\s*)-\s+\[x\]\s*(.*)$/i;

// 星号模式
const ASTERISK_DONE_PATTERN = /^(\s*)\*\s*✓\s*(\S.*)$/;
const ASTERISK_LEGACY_DONE_PATTERN = /^(\s*)\*\[x\]\s*(\S.*)$/i;
const ASTERISK_OPEN_PATTERN = /^(\s*)\*(?!\s*\[[ xX]\])(?!\s*✓)\s*(\S.*)$/;

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
    return parseCustomTodoLine(line, lineNumber, inDoneSection, syntaxConfig.customOpen, syntaxConfig.customDone);
  }

  return null;
}

function parseMarkdownTodoLine(line: string, lineNumber: number, inDoneSection: boolean): ParsedTodo | null {
  const doneMatch = MARKDOWN_DONE_PATTERN.exec(line);
  if (doneMatch) {
    return {
      line,
      lineNumber,
      indent: doneMatch[1],
      marker: "- [x]",
      text: doneMatch[2].trim(),
      completed: true,
      inDoneSection,
    };
  }

  const openMatch = MARKDOWN_OPEN_PATTERN.exec(line);
  if (openMatch) {
    return {
      line,
      lineNumber,
      indent: openMatch[1],
      marker: "- [ ]",
      text: openMatch[2].trim(),
      completed: false,
      inDoneSection,
    };
  }

  return null;
}

function parseAsteriskTodoLine(line: string, lineNumber: number, inDoneSection: boolean): ParsedTodo | null {
  const doneMatch = ASTERISK_DONE_PATTERN.exec(line);
  if (doneMatch) {
    return {
      line,
      lineNumber,
      indent: doneMatch[1],
      marker: "* ✓",
      text: doneMatch[2].trim(),
      completed: true,
      inDoneSection,
    };
  }

  const legacyDoneMatch = ASTERISK_LEGACY_DONE_PATTERN.exec(line);
  if (legacyDoneMatch) {
    return {
      line,
      lineNumber,
      indent: legacyDoneMatch[1],
      marker: "*[x]",
      text: legacyDoneMatch[2].trim(),
      completed: true,
      inDoneSection,
    };
  }

  const openMatch = ASTERISK_OPEN_PATTERN.exec(line);
  if (openMatch) {
    return {
      line,
      lineNumber,
      indent: openMatch[1],
      marker: "*",
      text: openMatch[2].trim(),
      completed: false,
      inDoneSection,
    };
  }

  return null;
}

function parseCustomTodoLine(
  line: string,
  lineNumber: number,
  inDoneSection: boolean,
  customOpen: string,
  customDone: string,
): ParsedTodo | null {
  const escapedDone = escapeRegex(customDone);
  const donePattern = new RegExp(`^(\\s*)${escapedDone}\\s+(\\S.*)$`);
  const doneMatch = donePattern.exec(line);
  if (doneMatch) {
    return {
      line,
      lineNumber,
      indent: doneMatch[1],
      marker: customDone,
      text: doneMatch[2].trim(),
      completed: true,
      inDoneSection,
    };
  }

  const escapedOpen = escapeRegex(customOpen);
  const openPattern = new RegExp(`^(\\s*)${escapedOpen}\\s+(\\S.*)$`);
  const openMatch = openPattern.exec(line);
  if (openMatch) {
    return {
      line,
      lineNumber,
      indent: openMatch[1],
      marker: customOpen,
      text: openMatch[2].trim(),
      completed: false,
      inDoneSection,
    };
  }

  return null;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// 为归档功能提供的跨语法模式已完成任务识别
export function parseCompletedTodoAnyMode(line: string, lineNumber: number, inDoneSection: boolean): ParsedTodo | null {
  // Markdown 原生
  const markdownMatch = MARKDOWN_DONE_PATTERN.exec(line);
  if (markdownMatch) {
    return {
      line,
      lineNumber,
      indent: markdownMatch[1],
      marker: "- [x]",
      text: markdownMatch[2].trim(),
      completed: true,
      inDoneSection,
    };
  }

  // 星号模式
  const asteriskMatch = ASTERISK_DONE_PATTERN.exec(line);
  if (asteriskMatch) {
    return {
      line,
      lineNumber,
      indent: asteriskMatch[1],
      marker: "* ✓",
      text: asteriskMatch[2].trim(),
      completed: true,
      inDoneSection,
    };
  }

  const legacyMatch = ASTERISK_LEGACY_DONE_PATTERN.exec(line);
  if (legacyMatch) {
    return {
      line,
      lineNumber,
      indent: legacyMatch[1],
      marker: "*[x]",
      text: legacyMatch[2].trim(),
      completed: true,
      inDoneSection,
    };
  }

  return null;
}

export function getUnfinishedTodos(content: string, syntaxConfig: TodoSyntaxConfig): ParsedTodo[] {
  return parseTodos(content, syntaxConfig).filter((todo) => !todo.completed && !todo.inDoneSection);
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
