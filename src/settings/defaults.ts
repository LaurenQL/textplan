import type { TextPlanSettings } from "./types";

export const DEFAULT_SETTINGS: TextPlanSettings = {
  dailyNoteDirectory: "textplan",
  fileNameFormat: "YYYYMMDD.md",
  weekStartDay: 0,
  recordCompletionTime: false,
  compatWithDailyNotes: false,
  todoSyntax: {
    mode: "markdown",
  },
  defaultCalendarMode: "month",
  weekViewLayout: "horizontal",
  missingNoteBehavior: "create",
  showDateInTabTitle: true,
  highlightActiveDailyNote: true,
  showCalendarEvents: true,
  icsSources: [],
};

/** 把旧版本存档里缺失的字段补成默认值，避免升级后出现 undefined。 */
export function migrateSettings(raw: unknown): TextPlanSettings {
  const stored = (raw ?? {}) as Partial<TextPlanSettings>;
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    todoSyntax: {
      ...DEFAULT_SETTINGS.todoSyntax,
      ...(stored.todoSyntax ?? {}),
    },
    icsSources: Array.isArray(stored.icsSources) ? stored.icsSources : [],
  };
}
