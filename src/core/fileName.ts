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

