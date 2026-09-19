import { App, MarkdownView, TFile } from "obsidian";
import { formatFullDate, type PlainDate } from "../core/date";
import { parseDateFromFileName } from "../core/fileName";
import type { Locale } from "../i18n/messages";
import type { TextPlanSettings } from "../settings/types";
import type { VaultStore } from "./vaultStore";

type GetDisplayText = (this: unknown) => string;
type PatchedGetDisplayText = GetDisplayText & { __textplanPatched?: boolean };

const PATCH_MARKER = "__textplanPatched";

/**
 * 在 Markdown 标签页标题上附加日期和星期。
 *
 * 需求（第 2 条）要的是「时刻知道自己今天在哪、今天星期几」，并且明确要求展示在
 * 笔记标签上，而不是日历里。实现方式是给 MarkdownView 原型上的 getDisplayText
 * 包一层 —— 只改标签页的标题文案，不碰编辑器内部 DOM，也不碰 Obsidian 原生
 * Markdown 编辑器 UI（AGENTS.md 的产品约束）。
 *
 * 卸载时把原型方法还原成原样，不留下痕迹。
 */
export class TabTitleDecorator {
  private original: GetDisplayText | null = null;

  constructor(
    private readonly app: App,
    private readonly vaultStore: VaultStore,
    private readonly getSettings: () => TextPlanSettings,
    private readonly getLocale: () => Locale,
  ) {}

  install(): void {
    const prototype = MarkdownView.prototype as unknown as Record<string, unknown>;
    const existing = prototype.getDisplayText;

    // 已经被别的插件（或本插件上一次加载）包过时，不再叠加一层
    if (typeof existing !== "function" || (existing as PatchedGetDisplayText)[PATCH_MARKER]) {
      return;
    }

    this.original = existing as GetDisplayText;

    const decorator = this;
    const patched = function (this: unknown): string {
      const base = (existing as GetDisplayText).call(this);
      return decorator.decorate(this, base);
    } as PatchedGetDisplayText;
    patched[PATCH_MARKER] = true;

    prototype.getDisplayText = patched;
  }

  uninstall(): void {
    if (!this.original) {
      return;
    }
    (MarkdownView.prototype as unknown as Record<string, unknown>).getDisplayText = this.original;
    this.original = null;
  }

  /** 设置变化后让已打开的标签页重新取标题。 */
  refresh(): void {
    this.app.workspace.trigger("layout-change");
  }

  private decorate(view: unknown, base: string): string {
    const settings = this.getSettings();
    if (!settings.showDateInTabTitle) {
      return base;
    }

    const file = (view as { file?: TFile | null }).file;
    if (!file) {
      return base;
    }

    const date = getDailyNoteDate(this.vaultStore, settings, file);
    if (!date) {
      return base;
    }

    const suffix = formatFullDate(date, this.getLocale());
    // 避免与别的插件（如 Periodic Notes）已经加过的后缀重复
    if (base.includes(suffix)) {
      return base;
    }
    return `${base} · ${suffix}`;
  }
}

/** 只认文件名，不做 vault 查询 —— 标签标题会频繁重算，这里必须够轻。 */
function getDailyNoteDate(vaultStore: VaultStore, settings: TextPlanSettings, file: TFile): PlainDate | null {
  const formats = new Set<string>([settings.fileNameFormat]);
  formats.add(vaultStore.getEffectiveConfig(settings).format);

  for (const format of formats) {
    const parsed = parseDateFromFileName(format, file.name);
    if (parsed) {
      return parsed;
    }
  }

  // 兼容模式下，Daily Notes 的格式串可能没被完全转换，退化到「按文件名推日期」的宽松解析
  if (settings.compatWithDailyNotes) {
    const loose = parseLooseDate(file.basename);
    if (loose) {
      return loose;
    }
  }

  return null;
}

const LOOSE_DATE_PATTERN = /(\d{4})[-_.]?(\d{2})[-_.]?(\d{2})/;

function parseLooseDate(basename: string): PlainDate | null {
  const match = LOOSE_DATE_PATTERN.exec(basename);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  const check = new Date(year, month - 1, day);
  if (check.getFullYear() !== year || check.getMonth() !== month - 1 || check.getDate() !== day) {
    return null;
  }
  return { year, month, day };
}
