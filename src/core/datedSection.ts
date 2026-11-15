import type { TodoSyntaxConfig } from "../settings/types";
import { parseTodoLine, splitLines, type ParsedTodo } from "./todo";

/** `### 2026-11-20` 这类三级标题标记这一组 todo 属于哪一天。 */
const DATED_HEADING_PATTERN = /^\s*#{3}\s+(\d{4})-(\d{2})-(\d{2})\s*$/;
const ANY_HEADING_PATTERN = /^\s*#{1,6}\s+/;
const DONE_HEADING_PATTERN = /^\s*##\s+Done\s*$/i;

export interface DatedSections {
  /** 日期键 `YYYY-MM-DD` → 该日期标题下的 todo，按文件内顺序。 */
  byDate: Map<string, ParsedTodo[]>;
  /** 落在日期标题下的行号。这些行不再算在文件自己那一天。 */
  lineNumbers: Set<number>;
}

export function parseDatedSections(content: string, syntaxConfig: TodoSyntaxConfig): DatedSections {
  const lines = splitLines(content);
  const byDate = new Map<string, ParsedTodo[]>();
  const lineNumbers = new Set<number>();
  let currentDate: string | null = null;
  let inDoneSection = false;

  lines.forEach((line, index) => {
    if (DONE_HEADING_PATTERN.test(line)) {
      inDoneSection = true;
      currentDate = null;
      return;
    }

    if (ANY_HEADING_PATTERN.test(line)) {
      const match = DATED_HEADING_PATTERN.exec(line);
      currentDate = match ? `${match[1]}-${match[2]}-${match[3]}` : null;
      return;
    }

    if (inDoneSection || !currentDate) {
      return;
    }

    const todo = parseTodoLine(line, index, false, syntaxConfig);
    if (!todo) {
      return;
    }

    lineNumbers.add(index);
    const bucket = byDate.get(currentDate) ?? [];
    bucket.push(todo);
    byDate.set(currentDate, bucket);
  });

  return { byDate, lineNumbers };
}
