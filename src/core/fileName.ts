import { normalizePath } from "./path";
import type { PlainDate } from "./date";
import { pad2 } from "./date";

export function formatDateFileName(format: string, date: PlainDate): string {
  return format
    .replaceAll("YYYY", String(date.year))
    .replaceAll("MM", pad2(date.month))
    .replaceAll("DD", pad2(date.day));
}

export function getDailyNotePath(directory: string, format: string, date: PlainDate): string {
  const fileName = formatDateFileName(format, date);
  const cleanDirectory = normalizePath(directory).replace(/^\/+|\/+$/g, "");

  if (!cleanDirectory) {
    return normalizePath(fileName);
  }

  return normalizePath(`${cleanDirectory}/${fileName}`);
}

const MOMENT_TOKEN_PATTERN = /\[[^\]]*\]|YYYY|YY|MM|M|DD|D|\[|\]/g;

/**
 * 从文件名反推日期，用于「打开已有日记文件时高亮日历格」。
 *
 * `format` 既可能是格式串（`YYYYMMDD`），也可能是同名的真实文件名（`YYYYMMDD.md`
 * 或 `20260917.md`），因此日期部分之外的字符按字面量逐字匹配。
 */
export function parseDateFromFileName(format: string, fileName: string): PlainDate | null {
  // 格式串可能自带扩展名，去掉后统一在末尾补回一个可选的 .md
  const normalizedFormat = format.replace(/\.md$/i, "");
  const tokens: Array<"year" | "month" | "day"> = [];
  let pattern = "^";
  let cursor = 0;
  let matches: RegExpExecArray | null;

  MOMENT_TOKEN_PATTERN.lastIndex = 0;
  while ((matches = MOMENT_TOKEN_PATTERN.exec(normalizedFormat)) !== null) {
    // token 之间的分隔符（-、.、空格等）要原样保留，否则 YYYY-MM-DD 会退化成 YYYYMMDD
    pattern += escapeRegex(normalizedFormat.slice(cursor, matches.index));
    cursor = matches.index + matches[0].length;

    const token = matches[0];
    if (token.startsWith("[")) {
      pattern += escapeRegex(token.slice(1, -1));
      continue;
    }
    if (token === "YYYY") {
      pattern += "(\\d{4})";
      tokens.push("year");
    } else if (token === "MM") {
      pattern += "(\\d{2})";
      tokens.push("month");
    } else if (token === "DD") {
      pattern += "(\\d{2})";
      tokens.push("day");
    } else if (token === "M" || token === "D") {
      pattern += "(\\d{1,2})";
      tokens.push(token === "M" ? "month" : "day");
    } else {
      pattern += escapeRegex(token);
    }
  }
  pattern += escapeRegex(normalizedFormat.slice(cursor));

  // 扩展名可有可无：调用方既可能传格式串（YYYYMMDD），也可能传真实文件名（20260917.md）
  pattern += "(?:\\.md)?$";

  if (!tokens.includes("year") || !tokens.includes("month") || !tokens.includes("day")) {
    return null;
  }

  const result = new RegExp(pattern, "i").exec(fileName);
  if (!result) {
    return null;
  }

  const date: PlainDate = { year: 0, month: 0, day: 0 };
  tokens.forEach((token, index) => {
    date[token] = Number(result[index + 1]);
  });

  if (date.month < 1 || date.month > 12 || date.day < 1 || date.day > 31) {
    return null;
  }

  // 校验日期真实存在，拦掉 20260230 这类假日期
  const check = new Date(date.year, date.month - 1, date.day);
  if (check.getFullYear() !== date.year || check.getMonth() !== date.month - 1 || check.getDate() !== date.day) {
    return null;
  }

  return date;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
