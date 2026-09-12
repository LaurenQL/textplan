import type { App } from "obsidian";

export interface DailyNotesConfig {
  folder: string;
  format: string;
  template: string;
}

/**
 * 从 Daily Notes 或 Periodic Notes 插件读取配置
 */
export function getDailyNotesConfig(app: App): DailyNotesConfig | null {
  // 尝试从 Daily Notes 插件读取
  const dailyNotesPlugin = (app as any).internalPlugins?.plugins?.["daily-notes"];
  if (dailyNotesPlugin?.enabled) {
    const config = dailyNotesPlugin.instance?.options;
    if (config) {
      return {
        folder: config.folder || "",
        format: config.format || "YYYY-MM-DD",
        template: config.template || "",
      };
    }
  }

  // 尝试从 Periodic Notes 插件读取每日笔记配置
  const periodicNotesPlugin = (app as any).plugins?.plugins?.["periodic-notes"];
  if (periodicNotesPlugin) {
    const dailyConfig = periodicNotesPlugin.settings?.daily;
    if (dailyConfig && dailyConfig.enabled !== false) {
      return {
        folder: dailyConfig.folder || "",
        format: dailyConfig.format || "YYYY-MM-DD",
        template: dailyConfig.template || "",
      };
    }
  }

  return null;
}

/**
 * 将 moment.js 格式转换为 TextPlan token 格式
 * 只支持常用格式，不常见格式返回 null
 */
export function convertMomentFormatToTextPlan(momentFormat: string): string | null {
  const commonFormats: Record<string, string> = {
    "YYYY-MM-DD": "YYYY-MM-DD.md",
    "YYYY/MM/DD": "YYYY/MM/DD.md",
    YYYYMMDD: "YYYYMMDD.md",
    "YYYY-MM-DD-dddd": "YYYY-MM-DD.md", // 忽略星期
    "YYYY_MM_DD": "YYYY_MM_DD.md",
    "YYYY.MM.DD": "YYYY.MM.DD.md",
  };

  // 移除 moment 格式中的 .md 后缀
  const normalizedFormat = momentFormat.replace(/\.md$/i, "");

  if (commonFormats[normalizedFormat]) {
    return commonFormats[normalizedFormat];
  }

  // 对于简单的 YYYY、MM、DD 组合尝试直接转换
  const simplePattern = /^[YMD\-_/.]+$/;
  if (simplePattern.test(normalizedFormat)) {
    return `${normalizedFormat}.md`;
  }

  return null;
}
