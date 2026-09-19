import { DONE_HEADING } from "../constants";
import {
  detectLineEnding,
  hasTrailingLineEnding,
  joinLines,
  parseCompletedTodoAnyMode,
  parseTodoLine,
  splitLines,
} from "./todo";
import type { TodoSyntaxConfig } from "../settings/types";

export interface ArchiveTodosResult {
  content: string;
  archivedCount: number;
}

const DONE_HEADING_PATTERN = /^\s*##\s+Done\s*$/i;

export function archiveCompletedTodos(content: string, syntaxConfig: TodoSyntaxConfig): ArchiveTodosResult {
  const lines = splitLines(content);
  const lineEnding = detectLineEnding(content);
  const trailingLineEnding = hasTrailingLineEnding(content);

  // Build the Done-block range: from `## Done` heading to next `#`/`##` or EOF.
  // Any completed todo OUTSIDE this range should be archived.
  const doneHeadingIndex = lines.findIndex((line) => DONE_HEADING_PATTERN.test(line));
  let doneBlockEnd = lines.length; // exclusive
  if (doneHeadingIndex !== -1) {
    for (let i = doneHeadingIndex + 1; i < lines.length; i++) {
      if (/^\s*#{1,2}\s/.test(lines[i])) {
        doneBlockEnd = i;
        break;
      }
    }
  }

  const isInDoneBlock = (index: number): boolean =>
    doneHeadingIndex !== -1 && index > doneHeadingIndex && index < doneBlockEnd;

  const remainingLines: string[] = [];
  const archivedLines: string[] = [];

  lines.forEach((line, index) => {
    // Skip the Done heading and its contents — they stay as-is.
    if (index === doneHeadingIndex || isInDoneBlock(index)) {
      remainingLines.push(line);
      return;
    }

    // Try current syntax mode first, then cross-mode fallback.
    let todo = parseTodoLine(line, index, false, syntaxConfig);
    if (!todo) {
      todo = parseCompletedTodoAnyMode(line, index, false);
    }

    // 只归档「已完成」。已放弃任务留在原位置 —— 放弃不是完成，不该进 Done 归档区（PRD 6.4）。
    if (todo?.state === "done") {
      archivedLines.push(line);
      return;
    }
    remainingLines.push(line);
  });

  if (archivedLines.length === 0) {
    return { content, archivedCount: 0 };
  }

  const resultLines = appendArchivedLines(remainingLines, archivedLines, doneHeadingIndex);

  return {
    content: joinLines(resultLines, lineEnding, trailingLineEnding),
    archivedCount: archivedLines.length,
  };
}

function appendArchivedLines(lines: string[], archivedLines: string[], originalDoneHeadingIndex: number): string[] {
  const doneHeadingIndex = lines.findIndex((line) => DONE_HEADING_PATTERN.test(line));

  if (doneHeadingIndex === -1 || originalDoneHeadingIndex === -1) {
    // Create a new Done block: blank line before heading, blank line after heading.
    const result = trimTrailingBlankLines([...lines]);
    if (result.length > 0) {
      result.push("");
    }
    result.push(DONE_HEADING, "", ...archivedLines);
    return result;
  }

  // Insert after the Done heading. Ensure there's a blank line between the heading and
  // the first archived line (the Done block may already have a blank line there — skip
  // inserting a duplicate).
  const insertIndex = doneHeadingIndex + 1;
  const result = [...lines];
  const nextLine = result[insertIndex];
  const needsBlank = nextLine !== undefined && nextLine.trim() !== "";
  if (needsBlank) {
    result.splice(insertIndex, 0, "", ...archivedLines);
  } else {
    result.splice(insertIndex, 0, ...archivedLines);
  }
  return result;
}

function trimTrailingBlankLines(lines: string[]): string[] {
  const result = [...lines];
  while (result.length > 0 && result[result.length - 1].trim() === "") {
    result.pop();
  }
  return result;
}
