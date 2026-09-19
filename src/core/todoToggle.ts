import type { TodoState, TodoSyntaxConfig } from "../settings/types";
import { getCustomAbandonedMarker, detectLineEnding, hasTrailingLineEnding, joinLines, parseTodoLine, splitLines } from "./todo";

export interface ToggleTodoOptions {
  recordCompletionTime: boolean;
  doneDate: string;
  syntaxConfig: TodoSyntaxConfig;
}

/** 点击和 CMD+D 的状态环：未完成 → 已完成 → 已放弃 → 未完成。 */
const NEXT_STATE: Record<TodoState, TodoState> = {
  open: "done",
  done: "abandoned",
  abandoned: "open",
};

export function toggleTodoLine(line: string, options: ToggleTodoOptions): string {
  const todo = parseTodoLine(line, 0, false, options.syntaxConfig);
  if (!todo) {
    return line;
  }

  return formatTodo(todo.indent, todo.text, NEXT_STATE[todo.state], options);
}

export function toggleTodoLines(
  content: string,
  startLine: number,
  endLine: number,
  options: ToggleTodoOptions,
): string {
  const lines = splitLines(content);
  const lineEnding = detectLineEnding(content);
  const trailingLineEnding = hasTrailingLineEnding(content);
  const from = Math.max(0, Math.min(startLine, endLine));
  const to = Math.min(lines.length - 1, Math.max(startLine, endLine));

  for (let index = from; index <= to; index += 1) {
    lines[index] = toggleTodoLine(lines[index], options);
  }

  return joinLines(lines, lineEnding, trailingLineEnding);
}

/** 把一行改写成指定状态。放弃任务不带 @done 时间戳。 */
export function formatTodo(
  indent: string,
  text: string,
  state: TodoState,
  options: ToggleTodoOptions,
): string {
  if (state === "open") {
    return formatOpenTodo(indent, removeDoneStamp(text), options.syntaxConfig);
  }

  if (state === "abandoned") {
    return formatAbandonedTodo(indent, removeDoneStamp(text), options.syntaxConfig);
  }

  return formatDoneTodo(indent, appendDoneStamp(text, options), options.syntaxConfig);
}

function formatOpenTodo(indent: string, text: string, syntaxConfig: TodoSyntaxConfig): string {
  if (syntaxConfig.mode === "markdown") {
    return `${indent}- [ ] ${text}`;
  }

  if (syntaxConfig.mode === "asterisk") {
    return `${indent}* ${text}`;
  }

  if (syntaxConfig.mode === "custom" && syntaxConfig.customOpen) {
    return `${indent}${syntaxConfig.customOpen} ${text}`;
  }

  return `${indent}- [ ] ${text}`;
}

function formatDoneTodo(indent: string, text: string, syntaxConfig: TodoSyntaxConfig): string {
  if (syntaxConfig.mode === "markdown") {
    return `${indent}- [x] ${text}`;
  }

  if (syntaxConfig.mode === "asterisk") {
    return `${indent}* ✓ ${text}`;
  }

  if (syntaxConfig.mode === "custom" && syntaxConfig.customDone) {
    return `${indent}${syntaxConfig.customDone} ${text}`;
  }

  return `${indent}- [x] ${text}`;
}

function formatAbandonedTodo(indent: string, text: string, syntaxConfig: TodoSyntaxConfig): string {
  if (syntaxConfig.mode === "markdown") {
    return `${indent}- [-] ${text}`;
  }

  if (syntaxConfig.mode === "asterisk") {
    return `${indent}* x ${text}`;
  }

  if (syntaxConfig.mode === "custom") {
    const marker = getCustomAbandonedMarker(syntaxConfig);
    if (marker) {
      return `${indent}${marker} ${text}`;
    }
  }

  return `${indent}- [-] ${text}`;
}

function appendDoneStamp(text: string, options: ToggleTodoOptions): string {
  const cleanText = removeDoneStamp(text);
  if (!options.recordCompletionTime) {
    return cleanText;
  }
  return `${cleanText} @done(${options.doneDate})`;
}

function removeDoneStamp(text: string): string {
  return text.replace(/\s*@done\(\d{4}-\d{2}-\d{2}\)\s*$/g, "").trimEnd();
}
