import type { PlainDate } from "./date";
import { isSameDate } from "./date";
import { parseDateFromFileName } from "./fileName";

export interface DailyNoteCandidate {
  /** vault 内完整路径。 */
  path: string;
  /** 文件所在目录，根目录为空字符串。 */
  directory: string;
}

export interface DailyNoteCandidates {
  /** 与配置目录一致的那些，优先采用。 */
  inDirectory: DailyNoteCandidate[];
  /** 目录不同但文件名能认出是同一天的那些。 */
  elsewhere: DailyNoteCandidate[];
}

export type DailyNoteLocation = "in-directory" | "elsewhere";

export interface DailyNoteMatch extends DailyNoteCandidate {
  location: DailyNoteLocation;
  /** 单文件模式下的候选列表，in-directory 命中时为空。 */
  alternatives: DailyNoteCandidate[];
}

export interface MatchDailyNoteInput {
  /** vault 内全部 Markdown 文件路径。 */
  paths: string[];
  date: PlainDate;
  /** 配置目录下的精确路径，命中则直接采用。 */
  expectedPath: string;
  /** 生成某个候选路径的文件名格式，用于把目录里的文件反推成日期。 */
  formatFileName: (date: PlainDate) => string;
  /** 原始文件名格式串，如 "YYYYMMDD"，用于从其他目录的文件名反推日期。 */
  fileNameFormat: string;
}

function directoryOf(path: string): string {
  return path.split("/").slice(0, -1).join("/");
}

/** 文件名部分，保留 .md，交给 parseDateFromFileName 处理。 */
function fileNameOf(path: string): string {
  return path.split("/").pop() ?? path;
}

function toCandidates(paths: string[], directory: string, formatFileName: (date: PlainDate) => string, date: PlainDate): DailyNoteCandidate[] {
  const expectedName = formatFileName(date).replace(/\.md$/i, "");
  return paths
    .filter((path) => directoryOf(path) === directory && fileNameOf(path).replace(/\.md$/i, "") === expectedName)
    .map((path) => ({ path, directory }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * 找出 vault 里代表某一天、且符合当前命名格式的日记文件。
 *
 * 这是第 3 条需求的核心：Daily Notes / Periodic Notes 生成的日记文件名只要和
 * TextPlan 配置一致，就必须复用同一份文件，不能各写各的、出现两份。
 */
export function matchDailyNote(input: MatchDailyNoteInput): DailyNoteMatch | null {
  const { paths, date, expectedPath, formatFileName, fileNameFormat } = input;

  // 1. 配置目录下的精确路径最优先，无歧义。调用方给的路径可能不带 .md。
  const normalizedExpected = expectedPath.endsWith(".md") ? expectedPath : `${expectedPath}.md`;
  const exact = paths.filter((path) => path === expectedPath || path === normalizedExpected);
  if (exact.length > 0) {
    return { path: exact[0], directory: directoryOf(exact[0]), location: "in-directory", alternatives: [] };
  }

  // 2. 同一目录下、文件名相同但扩展名写法不同。
  const expectedDirectory = directoryOf(normalizedExpected);
  const inDirectory = toCandidates(paths, expectedDirectory, formatFileName, date);
  if (inDirectory.length > 0) {
    return { ...inDirectory[0], location: "in-directory", alternatives: inDirectory.slice(1) };
  }

  // 3. 其他目录下能反推出同一天的文件：Daily Notes 装在根目录、TextPlan 配了子目录的典型情形。
  //    parseDateFromFileName 需要的是「格式串 + 文件名」，用 input.fileNameFormat 而非格式化后的日期字符串。
  const elsewhere = paths
    .filter((path) => directoryOf(path) !== expectedDirectory)
    .map((path) => ({ path, parsed: parseDateFromFileName(fileNameFormat, fileNameOf(path)) }))
    .filter((entry) => entry.parsed !== null && isSameDate(entry.parsed, date))
    .map((entry) => ({ path: entry.path, directory: directoryOf(entry.path) }))
    .sort((a, b) => a.path.localeCompare(b.path));

  if (elsewhere.length > 0) {
    return { ...elsewhere[0], location: "elsewhere", alternatives: elsewhere.slice(1) };
  }

  return null;
}
