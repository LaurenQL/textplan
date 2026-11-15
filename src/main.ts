import { MarkdownView, Plugin, TFile } from "obsidian";
import { formatFullDate, formatIsoDate, today, type PlainDate } from "./core/date";
import { detectLocale, createTranslator, type Locale, type MessageKey } from "./i18n/messages";
import { archiveActiveMarkdownFile, toggleTodosInEditor } from "./obsidian/editorCommands";
import { createTodoDecorationExtension } from "./obsidian/todoDecorations";
import { createTextPlanEditorClass } from "./obsidian/textPlanEditorScope";
import { createTodoClickExtension } from "./obsidian/todoClickExtension";
import { DatedTodoIndex } from "./obsidian/datedTodoIndex";
import { IcsClient } from "./obsidian/icsClient";
import { TabTitleDecorator } from "./obsidian/tabTitle";
import { ensureTextPlanViewInLeftSidebar, openMarkdownFileBeside, openTextPlanView } from "./obsidian/workspace";
import { VaultStore } from "./obsidian/vaultStore";
import { migrateSettings } from "./settings/defaults";
import { TextPlanSettingTab } from "./settings/TextPlanSettingTab";
import type { TextPlanSettings } from "./settings/types";
import { CreateDailyNoteModal } from "./ui/CreateDailyNoteModal";
import { TextPlanView } from "./ui/TextPlanView";
import { TEXTPLAN_VIEW_TYPE } from "./constants";

export default class TextPlanPlugin extends Plugin {
  settings: TextPlanSettings = migrateSettings(null);
  vaultStore!: VaultStore;
  icsClient!: IcsClient;
  /** 日记里 `### 日期` 分组 todo 的跨文件索引。 */
  datedTodoIndex!: DatedTodoIndex;
  locale: Locale = "en";
  t!: (key: MessageKey, values?: Record<string, string | number>) => string;
  activeDailyFile: TFile | null = null;
  lastActiveMarkdownFile: TFile | null = null;

  private tabTitles!: TabTitleDecorator;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.locale = detectLocale(window.localStorage.getItem("language") ?? navigator.language);
    this.t = createTranslator(this.locale);
    this.vaultStore = new VaultStore(this.app.vault, this.app);
    this.datedTodoIndex = new DatedTodoIndex(this.app.vault, this.vaultStore);
    this.icsClient = new IcsClient();
    this.tabTitles = new TabTitleDecorator(this.app, this.vaultStore, () => this.settings, () => this.locale);

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

    this.tabTitles.install();

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

    const onVaultChange = (): void => {
      this.datedTodoIndex.invalidate();
      this.refreshViews();
    };
    this.registerEvent(this.app.vault.on("modify", onVaultChange));
    this.registerEvent(this.app.vault.on("create", onVaultChange));
    this.registerEvent(this.app.vault.on("delete", onVaultChange));
    this.registerEvent(this.app.vault.on("rename", onVaultChange));

    // Track the most recently active Markdown file so archive can target it
    // even when focus has moved to the TextPlan calendar view. The same event
    // drives 「打开日记文件时高亮对应格子」.
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf) => {
        const view = leaf?.view;
        if (view instanceof MarkdownView && view.file) {
          this.lastActiveMarkdownFile = view.file;
        }
        void this.highlightActiveDailyNote(view instanceof MarkdownView ? view.file : null);
      }),
    );

    // Auto-mount to the left sidebar on first load.
    this.app.workspace.onLayoutReady(() => {
      void ensureTextPlanViewInLeftSidebar(this.app.workspace);
    });
  }

  onunload(): void {
    this.tabTitles.uninstall();
    this.app.workspace.detachLeavesOfType(TEXTPLAN_VIEW_TYPE);
  }

  async loadSettings(): Promise<void> {
    this.settings = migrateSettings(await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.refreshViews();
    // 编辑器扩展会通过 getSettings 回调自动获取新配置
  }

  /**
   * 打开某一天的日记。
   *
   * 默认直接新建；设置成「先弹窗询问」时，只有文件不存在才询问，已经存在的文件
   * 直接打开。返回 false 表示用户取消了。
   */
  async openDailyNote(date: PlainDate): Promise<boolean> {
    const existing = this.vaultStore.findDailyNoteFile(this.settings, date);
    if (!existing && this.settings.missingNoteBehavior === "none") {
      // 「只选中，不新建」：日历已经通过 registerDayClick 更新过选中态，这里不动文件
      return false;
    }
    if (!existing && this.settings.missingNoteBehavior === "ask") {
      const confirmed = await this.askToCreateDailyNote(date);
      if (!confirmed) {
        return false;
      }
    }

    const file = existing ?? (await this.vaultStore.createDailyNote(this.settings, date));
    this.activeDailyFile = file;
    await openMarkdownFileBeside(this.app.workspace, file);
    return true;
  }

  /**
   * 「今天」按钮。
   *
   * 兼容模式下优先走 Daily Notes / Periodic Notes 自己的命令，这样打开的是插件
   * 按自己模板生成的文件，行为和用户给插件绑的快捷键完全一致；命令不存在或执行
   * 失败时退回插件自身的创建逻辑。
   */
  async openToday(): Promise<void> {
    if (this.settings.compatWithDailyNotes && this.runCompanionTodayCommand()) {
      return;
    }
    await this.openDailyNote(today());
  }

  private runCompanionTodayCommand(): boolean {
    const app = this.app as unknown as {
      commands?: { commands?: Record<string, unknown>; executeCommandById?: (id: string) => boolean };
    };
    const registry = app.commands;
    if (!registry?.commands || typeof registry.executeCommandById !== "function") {
      return false;
    }
    const candidates = ["daily-notes", "periodic-notes:open-daily-note"];
    const id = candidates.find((candidate) => candidate in (registry.commands as Record<string, unknown>));
    return id ? registry.executeCommandById(id) : false;
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

  /**
   * 弹窗询问是否新建日记。用户关闭弹窗（Esc / 点遮罩）算取消。
   *
   * 判定放在 onClose 里一次性完成：点「新建」时 confirmed 已经为 true，点取消或
   * 直接关掉则为 false，不会出现两条路径抢着 resolve 的情况。
   */
  private askToCreateDailyNote(date: PlainDate): Promise<boolean> {
    return new Promise((resolve) => {
      const modal = new CreateDailyNoteModal(this.app, {
        date,
        path: this.vaultStore.getDailyNotePath(this.settings, date),
        locale: this.locale,
        t: this.t,
        onClose: resolve,
      });
      modal.open();
    });
  }

  getDoneDate(): string {
    return formatIsoDate(today());
  }

  /** 某个文件对应的日记日期，认不出返回 null。 */
  getDateForFile(file: TFile): PlainDate | null {
    return this.vaultStore.getDateForFile(this.settings, file);
  }

  /** 焦点切到日记文件时，把日历翻到那一页并高亮。 */
  private async highlightActiveDailyNote(file: TFile | null): Promise<void> {
    if (!this.settings.highlightActiveDailyNote) {
      return;
    }
    if (!file) {
      return;
    }

    const date = this.getDateForFile(file);
    if (!date) {
      return;
    }
    // 不缓存「上次高亮过哪天」——用户可能在日历里翻走了再点回同一个文件，
    // 这时仍然需要把日历翻回来。是否重绘交给 view 自己判断。
    await this.focusCalendarOn(date);
  }

  private async focusCalendarOn(date: PlainDate): Promise<void> {
    const leaves = this.app.workspace.getLeavesOfType(TEXTPLAN_VIEW_TYPE);
    await Promise.all(
      leaves.map((leaf) => (leaf.view instanceof TextPlanView ? leaf.view.focusDate(date) : Promise.resolve())),
    );
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

      // 冲突时静默跳过默认快捷键注册，用户可在快捷键设置中手动绑定
      if (conflict) return;

      hm.addDefaultHotkeys("textplan:open-textplan", [{ modifiers: ["Mod", "Shift"], key: "t" }]);
    }
  }

  /** 供标签页标题使用的「今天 + 星期」后缀。 */
  formatTodaySuffix(): string {
    return formatFullDate(today(), this.locale);
  }

  private refreshViews(): void {
    this.tabTitles.refresh();
    this.app.workspace.getLeavesOfType(TEXTPLAN_VIEW_TYPE).forEach((leaf) => {
      if (leaf.view instanceof TextPlanView) {
        void leaf.view.refresh();
      }
    });
  }
}
