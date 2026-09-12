import { TFile, Vault, normalizePath, App } from "obsidian";
import type { PlainDate } from "../core/date";
import { getDailyNotePath } from "../core/fileName";
import type { TextPlanSettings } from "../settings/types";
import { convertMomentFormatToTextPlan, getDailyNotesConfig } from "./dailyNotesCompat";

export class VaultStore {
  constructor(private readonly vault: Vault, private readonly app: App) {}

  getDailyNotePath(settings: TextPlanSettings, date: PlainDate): string {
    if (settings.compatWithDailyNotes) {
      const config = getDailyNotesConfig(this.app);
      if (config) {
        const format = convertMomentFormatToTextPlan(config.format) ?? settings.fileNameFormat;
        // 使用 Daily Notes 的 folder，即使是空字符串（表示根目录）
        return normalizePath(getDailyNotePath(config.folder, format, date));
      }
    }
    return normalizePath(getDailyNotePath(settings.dailyNoteDirectory, settings.fileNameFormat, date));
  }

  getDailyNoteFile(settings: TextPlanSettings, date: PlainDate): TFile | null {
    const path = this.getDailyNotePath(settings, date);
    const file = this.vault.getAbstractFileByPath(path);
    return file instanceof TFile ? file : null;
  }

  async ensureDailyNote(settings: TextPlanSettings, date: PlainDate): Promise<TFile> {
    const path = this.getDailyNotePath(settings, date);
    const existing = this.vault.getAbstractFileByPath(path);

    if (existing instanceof TFile) {
      return existing;
    }

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
    const file = this.getDailyNoteFile(settings, date);
    if (!file) {
      return "";
    }
    return this.vault.cachedRead(file);
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
    const folderPath = filePath.split("/").slice(0, -1).join("/");
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

