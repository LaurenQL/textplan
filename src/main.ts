import { MarkdownView, Notice, Plugin, TFile } from "obsidian";
import { formatIsoDate, today, type PlainDate } from "./core/date";
import { detectLocale, createTranslator, type Locale, type MessageKey } from "./i18n/messages";
import { archiveActiveMarkdownFile, toggleTodosInEditor } from "./obsidian/editorCommands";
import { createTodoDecorationExtension } from "./obsidian/todoDecorations";
import { createTextPlanEditorClass } from "./obsidian/textPlanEditorScope";
import { createTodoClickExtension } from "./obsidian/todoClickExtension";
import { ensureTextPlanViewInLeftSidebar, openMarkdownFileBeside, openTextPlanView } from "./obsidian/workspace";
import { VaultStore } from "./obsidian/vaultStore";
import { DEFAULT_SETTINGS } from "./settings/defaults";
import { TextPlanSettingTab } from "./settings/TextPlanSettingTab";
import type { TextPlanSettings } from "./settings/types";
import { TextPlanView } from "./ui/TextPlanView";
import { TEXTPLAN_VIEW_TYPE } from "./constants";

export default class TextPlanPlugin extends Plugin {
  settings: TextPlanSettings = { ...DEFAULT_SETTINGS };
  vaultStore!: VaultStore;
  locale: Locale = "en";
  t!: (key: MessageKey, values?: Record<string, string | number>) => string;
  activeDailyFile: TFile | null = null;
  lastActiveMarkdownFile: TFile | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.locale = detectLocale(window.localStorage.getItem("language") ?? navigator.language);
    this.t = createTranslator(this.locale);
    this.vaultStore = new VaultStore(this.app.vault, this.app);

    this.registerView(TEXTPLAN_VIEW_TYPE, (leaf) => new TextPlanView(leaf, this));
    this.registerEditorExtension(createTextPlanEditorClass(() => this.settings, () => this.app));
    this.registerEditorExtension(
      createTodoDecorationExtension(() => ({
        syntaxConfig: this.settings.todoSyntax,
      })),
    );
    this.registerEditorExtension(
      createTodoClickExtension(
        () => this.settings,
        () => this.getDoneDate(),
        () => this.refreshViews(),
      ),
    );
    this.addSettingTab(new TextPlanSettingTab(this.app, this));

    this.addCommand({
      id: "open-textplan",
      name: this.t("openTextPlan"),
      callback: async () => {
        await openTextPlanView(this.app.workspace);
      },
    });

    // Register CMD+SHIFT+T as the default hotkey unless something else already
    // has it bound. Obsidian's hotkeyManager exposes getHotkeys(commandId) and
    // the defaultKeys map; we check all commands for a collision instead.
    this.registerOpenTextPlanHotkey();

    this.addCommand({
      id: "toggle-todo-status",
      name: this.t("toggleTodo"),
      hotkeys: [{ modifiers: ["Mod"], key: "d" }],
      editorCallback: (editor) => {
        toggleTodosInEditor(editor, this.settings);
        this.refreshViews();
      },
    });

    this.addCommand({
      id: "archive-completed-todos",
      name: this.t("archiveCompletedTodos"),
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "a" }],
      callback: async () => {
        await this.archiveActiveFile();
      },
    });

    this.registerEvent(this.app.vault.on("modify", () => this.refreshViews()));
    this.registerEvent(this.app.vault.on("create", () => this.refreshViews()));
    this.registerEvent(this.app.vault.on("delete", () => this.refreshViews()));

    // Track the most recently active Markdown file so archive can target it
    // even when focus has moved to the TextPlan calendar view.
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf) => {
        const view = leaf?.view;
        if (view instanceof MarkdownView && view.file) {
          this.lastActiveMarkdownFile = view.file;
        }
      }),
    );

    // Auto-mount to the left sidebar on first load.
    this.app.workspace.onLayoutReady(() => {
      void ensureTextPlanViewInLeftSidebar(this.app.workspace);
    });
  }

  onunload(): void {
    this.app.workspace.detachLeavesOfType(TEXTPLAN_VIEW_TYPE);
  }

  async loadSettings(): Promise<void> {
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...(await this.loadData()),
    };
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.refreshViews();
    // 编辑器扩展会通过 getSettings 回调自动获取新配置
  }

  async openDailyNote(date: PlainDate): Promise<void> {
    const file = await this.vaultStore.ensureDailyNote(this.settings, date);
    this.activeDailyFile = file;
    await openMarkdownFileBeside(this.app.workspace, file);
  }

  async archiveActiveFile(): Promise<void> {
    await archiveActiveMarkdownFile(
      this.app.workspace.getActiveViewOfType(MarkdownView),
      this.lastActiveMarkdownFile,
      this.vaultStore,
      this.settings,
      this.t,
      this.app.workspace,
    );
    this.refreshViews();
  }

  getDoneDate(): string {
    return formatIsoDate(today());
  }

  private registerOpenTextPlanHotkey(): void {
    type AppWithInternals = {
      hotkeyManager?: {
        getHotkeys: (id: string) => Array<{ modifiers: string[]; key: string }>;
        addDefaultHotkeys: (id: string, keys: Array<{ modifiers: string[]; key: string }>) => void;
      };
      commands?: {
        commands: Record<string, unknown>;
      };
    };
    const app = this.app as unknown as AppWithInternals;
    const hm = app.hotkeyManager;

    if (hm) {
      const allCommands = app.commands?.commands ?? {};
      const conflict = Object.keys(allCommands).find((id) => {
        if (id === "textplan:open-textplan") return false;
        const keys = hm.getHotkeys(id) ?? [];
        return keys.some(
          (k) =>
            k.key.toLowerCase() === "t" &&
            k.modifiers.includes("Mod") &&
            k.modifiers.includes("Shift"),
        );
      });

      if (conflict) {
        new Notice(this.t("hotkeyConflict"), 8000);
        return;
      }

      hm.addDefaultHotkeys("textplan:open-textplan", [{ modifiers: ["Mod", "Shift"], key: "t" }]);
    }
  }

  private refreshViews(): void {
    this.app.workspace.getLeavesOfType(TEXTPLAN_VIEW_TYPE).forEach((leaf) => {
      if (leaf.view instanceof TextPlanView) {
        void leaf.view.refresh();
      }
    });
  }
}
