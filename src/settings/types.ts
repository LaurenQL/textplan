export type TodoSyntaxMode = "markdown" | "asterisk" | "custom";

export interface TodoSyntaxConfig {
  mode: TodoSyntaxMode;
  customOpen?: string;
  customDone?: string;
}

export type CalendarMode = "month" | "week";
export type WeekViewLayout = "vertical" | "horizontal";

export interface TextPlanSettings {
  dailyNoteDirectory: string;
  fileNameFormat: string;
  weekStartDay: number;
  recordCompletionTime: boolean;
  compatWithDailyNotes: boolean;
  todoSyntax: TodoSyntaxConfig;
  defaultCalendarMode: CalendarMode;
  weekViewLayout: WeekViewLayout;
}
