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
};
