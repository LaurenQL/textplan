import { Editor, MarkdownView, Notice, TFile, Workspace } from "obsidian";
import { formatIsoDate, today } from "../core/date";
import { archiveCompletedTodos } from "../core/todoArchive";
import { toggleTodoLines } from "../core/todoToggle";
import type { TextPlanSettings } from "../settings/types";
import type { VaultStore } from "./vaultStore";

export function toggleTodosInEditor(editor: Editor, settings: TextPlanSettings): void {
  const content = editor.getValue();
  const selections = editor.listSelections();
  const doneDate = formatIsoDate(today());
  const targetSelections = selections.length > 0 ? selections : [{ anchor: editor.getCursor(), head: editor.getCursor() }];
  let nextContent = content;

  targetSelections.forEach((selection) => {
    const startLine = Math.min(selection.anchor.line, selection.head.line);
    const endLine = Math.max(selection.anchor.line, selection.head.line);
    nextContent = toggleTodoLines(nextContent, startLine, endLine, {
      recordCompletionTime: settings.recordCompletionTime,
      doneDate,
      syntaxConfig: settings.todoSyntax,
    });
  });

  if (nextContent !== content) {
    editor.setValue(nextContent);
  }
}

export async function archiveActiveMarkdownFile(
  view: MarkdownView | null,
  fallbackFile: TFile | null,
  vaultStore: VaultStore,
  settings: TextPlanSettings,
  t: (key: "noActiveMarkdownFile" | "archivedCount", values?: Record<string, string | number>) => string,
  workspace?: Workspace,
): Promise<void> {
  const file: TFile | null = view?.file ?? fallbackFile;
  if (!file) {
    new Notice(t("noActiveMarkdownFile"));
    return;
  }

  // 归档走 Vault.process()，读的是磁盘内容；而编辑器改动是防抖写盘的。
  // 用快捷键归档时焦点还在编辑器里，缓冲区往往尚未落盘，会导致：
  //   1. 读到旧内容，刚标完成的任务归档不到（"归档 0 个"）
  //   2. 编辑器随后刷盘，覆盖掉归档结果
  // 所以先把该文件所有打开的编辑器强制刷盘，再处理。
  if (workspace) {
    await flushEditorsForFile(workspace, file);
  }

  let archivedCount = 0;
  await vaultStore.processFile(file, (content) => {
    const result = archiveCompletedTodos(content, settings.todoSyntax);
    archivedCount = result.archivedCount;
    return result.content;
  });

  new Notice(t("archivedCount", { count: archivedCount }));
}

/** 把指定文件所有打开的 Markdown 编辑器缓冲区落盘，避免归档读到过期内容。 */
async function flushEditorsForFile(workspace: Workspace, file: TFile): Promise<void> {
  const pending: Promise<void>[] = [];

  workspace.getLeavesOfType("markdown").forEach((leaf) => {
    const leafView = leaf.view;
    if (!(leafView instanceof MarkdownView) || leafView.file?.path !== file.path) return;
    // save() 不在公开类型里，缺失时静默跳过而不是让归档失败
    const save = (leafView as unknown as { save?: () => Promise<void> }).save;
    if (typeof save === "function") {
      pending.push(Promise.resolve(save.call(leafView)).catch(() => undefined));
    }
  });

  await Promise.all(pending);
}
