import type { TodoSyntaxConfig } from "../settings/types";
import { detectLineEnding, hasTrailingLineEnding, joinLines, parseTodoLine, splitLines } from "./todo";

export interface ToggleTodoOptions {
  recordCompletionTime: boolean;
  doneDate: string;
  syntaxConfig: TodoSyntaxConfig;
}

export function toggleTodoLine(line: string, options: ToggleTodoOptions): string {
  const todo = parseTodoLine(line, 0, false, options.syntaxConfig);
  if (!todo) {
    return line;
  }

  if (todo.completed) {
    return formatOpenTodo(todo.indent, removeDoneStamp(todo.text), options.syntaxConfig);
  }

  return formatDoneTodo(todo.indent, appendDoneStamp(todo.text, options), options.syntaxConfig);
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
