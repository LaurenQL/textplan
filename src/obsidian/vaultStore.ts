import { TFile, Vault, normalizePath, App } from "obsidian";
import { isSameDate, type PlainDate } from "../core/date";
import { formatDateFileName, getDailyNotePath, parseDateFromFileName } from "../core/fileName";
import { matchDailyNote, type DailyNoteMatch } from "../core/dailyNoteMatch";
import type { TextPlanSettings } from "../settings/types";
import { convertMomentFormatToTextPlan, getDailyNotesConfig } from "./dailyNotesCompat";

function parentDirectory(path: string): string {
  return path.split("/").slice(0, -1).join("/");
}

export class VaultStore {
  constructor(private readonly vault: Vault, private readonly app: App) {}

  /** 当前生效的日记目录和文件名格式：兼容模式下以 Daily Notes / Periodic Notes 的配置为准。 */
  getEffectiveConfig(settings: TextPlanSettings): { directory: string; format: string } {
    if (settings.compatWithDailyNotes) {
      const config = getDailyNotesConfig(this.app);
      if (config) {
        return {
          directory: config.folder,
          format: convertMomentFormatToTextPlan(config.format) ?? settings.fileNameFormat,
        };
      }
    }
    return { directory: settings.dailyNoteDirectory, format: settings.fileNameFormat };
  }

  /** 当前生效的日记目录，规范化成 vault 相对路径（根目录为空字符串）。 */
  getEffectiveDirectory(settings: TextPlanSettings): string {
    return normalizePath(this.getEffectiveConfig(settings).directory).replace(/^\/+|\/+$/g, "");
  }

  getDailyNotePath(settings: TextPlanSettings, date: PlainDate): string {
    const { directory, format } = this.getEffectiveConfig(settings);
    return normalizePath(getDailyNotePath(directory, format, date));
  }

  /** 按配置路径直接取文件，不做全 vault 查找。 */
  getDailyNoteFile(settings: TextPlanSettings, date: PlainDate): TFile | null {
    const file = this.vault.getAbstractFileByPath(this.getDailyNotePath(settings, date));
    return file instanceof TFile ? file : null;
  }

  /**
   * 找出 vault 里代表这一天的日记文件。
   *
   * 优先配置目录下的精确路径；找不到时在配置目录内按文件名找；再找不到才去别的
   * 目录找。这样 Daily Notes / Periodic Notes 生成的文件只要命名规则一致就会被
   * 复用，不会出现两份。
   */
  findDailyNote(settings: TextPlanSettings, date: PlainDate): DailyNoteMatch | null {
    const { format } = this.getEffectiveConfig(settings);
    const paths = this.vault.getMarkdownFiles().map((file) => file.path);

    return matchDailyNote({
      paths,
      date,
      expectedPath: this.getDailyNotePath(settings, date),
      formatFileName: (target) => formatDateFileName(format, target),
      fileNameFormat: format,
    });
  }

  /** 已有日记则返回，没有则返回 null。用于「点击格子先问用户」的判定。 */
  findDailyNoteFile(settings: TextPlanSettings, date: PlainDate): TFile | null {
    const match = this.findDailyNote(settings, date);
    if (!match) {
      return null;
    }
    const file = this.vault.getAbstractFileByPath(match.path);
    return file instanceof TFile ? file : null;
  }

  /** 已有日记则复用，没有才新建。 */
  async ensureDailyNote(settings: TextPlanSettings, date: PlainDate): Promise<TFile> {
    const existing = this.findDailyNoteFile(settings, date);
    if (existing) {
      return existing;
    }
    return this.createDailyNote(settings, date);
  }

  /** 无条件新建日记文件。调用方需要自行确认目标文件不存在。 */
  async createDailyNote(settings: TextPlanSettings, date: PlainDate): Promise<TFile> {
    const path = this.getDailyNotePath(settings, date);
    await this.ensureFolder(path);

    let content = "";

    // 兼容模式下尝试应用模板
    if (settings.compatWithDailyNotes) {
      const config = getDailyNotesConfig(this.app);
      if (config?.template) {
        content = await this.readTemplateContent(config.template);
      }
    }

    return this.vault.create(path, content);
  }

  async readDailyNote(settings: TextPlanSettings, date: PlainDate): Promise<string> {
    const file = this.findDailyNoteFile(settings, date);
    if (!file) {
      return "";
    }
    return this.vault.cachedRead(file);
  }

  /**
   * 从文件反推它代表哪一天，用于「打开日记文件时高亮日历格」。
   *
   * 分两遍：先只看名字，认的是本插件配置的命名格式和兼容模式下 Daily Notes /
   * Periodic Notes 的命名格式 —— 这正是第 3 条要的「命名规则一致就兼容」。名字认
   * 不出来时，再看它是不是就躺在配置目录里、且目录里已经没有别人了。
   */
  getDateForFile(settings: TextPlanSettings, file: TFile): PlainDate | null {
    const formats = new Set<string>([settings.fileNameFormat]);
    formats.add(this.getEffectiveConfig(settings).format);
    if (settings.compatWithDailyNotes) {
      const config = getDailyNotesConfig(this.app);
      const converted = config ? convertMomentFormatToTextPlan(config.format) : null;
      if (converted) {
        formats.add(converted);
      }
    }

    for (const format of formats) {
      const parsed = parseDateFromFileName(format, file.name);
      if (parsed) {
        return parsed;
      }
    }

    return null;
  }

  async processFile(file: TFile, processor: (content: string) => string): Promise<void> {
    await this.vault.process(file, processor);
  }

  private async readTemplateContent(templatePath: string): Promise<string> {
    try {
      const normalizedPath = normalizePath(templatePath);
      const file = this.vault.getAbstractFileByPath(normalizedPath);
      if (file instanceof TFile) {
        return await this.vault.cachedRead(file);
      }
    } catch (error) {
      console.warn("Failed to read template:", error);
    }
    return "";
  }

  private async ensureFolder(filePath: string): Promise<void> {
    const folderPath = parentDirectory(filePath);
    if (!folderPath || this.vault.getAbstractFileByPath(folderPath)) {
      return;
    }

    const parts = folderPath.split("/");
    let current = "";
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      if (!this.vault.getAbstractFileByPath(current)) {
        await this.vault.createFolder(current);
      }
    }
  }
}

/** 两个 PlainDate 是否同一天，供适配层复用，避免各处重复 import。 */
export { isSameDate };
