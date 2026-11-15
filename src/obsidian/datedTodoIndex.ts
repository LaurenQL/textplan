import { TFile, Vault } from "obsidian";
import { parseDatedSections } from "../core/datedSection";
import type { ParsedTodo } from "../core/todo";
import type { TextPlanSettings } from "../settings/types";
import type { VaultStore } from "./vaultStore";

interface CacheEntry {
  mtime: number;
  byDate: Map<string, ParsedTodo[]>;
  lineNumbers: Set<number>;
}

/**
 * 跨日记文件的「按日期分组的 todo」索引。
 *
 * 日记文件里用 `### 2026-11-20` 这样的三级标题给一组 todo 指定生效日期，日历就
 * 把这一组显示在 11 月 20 日那格，而不是写它的那一天。索引按 path + mtime 缓存，
 * 文件没变就不重新解析。文件内容改变后 mtime 会变，下一次重建时只重新解析变过的。
 */
export class DatedTodoIndex {
  private cache = new Map<string, CacheEntry>();

  constructor(
    private readonly vault: Vault,
    private readonly vaultStore: VaultStore,
  ) {}

  invalidate(): void {
    this.cache.clear();
  }

  /** 重建索引（只解析新增或改动过的文件）。 */
  async refresh(settings: TextPlanSettings): Promise<void> {
    const files = this.dailyNoteFiles(settings);

    // 文件被删掉时，缓存里对应的条目也要清掉
    const alive = new Set(files.map((file) => file.path));
    [...this.cache.keys()].forEach((path) => {
      if (!alive.has(path)) {
        this.cache.delete(path);
      }
    });

    const changed = files.filter((file) => this.cache.get(file.path)?.mtime !== file.stat.mtime);
    await Promise.all(changed.map((file) => this.load(file, settings)));
  }

  /** 某个日期下、由 `###` 标题分组进来的 todo，按文件名排序保证顺序稳定。 */
  getTodosForDate(dateKey: string): ParsedTodo[] {
    const collected: Array<{ path: string; todos: ParsedTodo[] }> = [];
    this.cache.forEach((entry, path) => {
      const todos = entry.byDate.get(dateKey);
      if (todos && todos.length > 0) {
        collected.push({ path, todos });
      }
    });
    collected.sort((a, b) => a.path.localeCompare(b.path));
    return collected.flatMap((item) => item.todos);
  }

  /** 某篇日记里属于 `###` 日期标题的行号，渲染当天时要排除。 */
  getDatedLineNumbers(file: TFile): Set<number> {
    return this.cache.get(file.path)?.lineNumbers ?? new Set<number>();
  }

  private async load(file: TFile, settings: TextPlanSettings): Promise<void> {
    const content = await this.vault.cachedRead(file);
    const parsed = parseDatedSections(content, settings.todoSyntax);
    this.cache.set(file.path, {
      mtime: file.stat.mtime,
      byDate: parsed.byDate,
      lineNumbers: parsed.lineNumbers,
    });
  }

  /** 只认能解析出日期的文件，避免把普通笔记也扫一遍。 */
  private dailyNoteFiles(settings: TextPlanSettings): TFile[] {
    return this.vault.getMarkdownFiles().filter((file) => this.vaultStore.getDateForFile(settings, file) !== null);
  }
}
