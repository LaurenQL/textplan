export type TodoSyntaxMode = "markdown" | "asterisk" | "custom";

/** 任务状态：未完成 / 已完成 / 已放弃。已放弃与已完成一样显示删除线，但不进 ## Done。 */
export type TodoState = "open" | "done" | "abandoned";

export interface TodoSyntaxConfig {
  mode: TodoSyntaxMode;
  customOpen?: string;
  customDone?: string;
  customAbandoned?: string;
}

export type CalendarMode = "month" | "week";
export type WeekViewLayout = "vertical" | "horizontal";

/** 点击日历空格子时的行为。 */
export type MissingNoteBehavior = "create" | "ask";

/** 日历事件订阅源。只读展示，不回写。 */
export interface IcsSource {
  id: string;
  /** 用户可见名称，同时显示在事件条目上。 */
  name: string;
  /** ICS 订阅地址（https）。 */
  url: string;
  enabled: boolean;
}

export interface TextPlanSettings {
  dailyNoteDirectory: string;
  fileNameFormat: string;
  weekStartDay: number;
  recordCompletionTime: boolean;
  compatWithDailyNotes: boolean;
  todoSyntax: TodoSyntaxConfig;
  defaultCalendarMode: CalendarMode;
  weekViewLayout: WeekViewLayout;
  /** 点击还没有日记文件的日期格时：直接新建，还是先弹窗询问。 */
  missingNoteBehavior: MissingNoteBehavior;
  /** 在 Markdown 标签页标题上附加日期和星期。 */
  showDateInTabTitle: boolean;
  /** 打开 TextPlan 日记文件时，自动在日历里高亮对应日期。 */
  highlightActiveDailyNote: boolean;
  /** 只在当前显示的月/周内渲染日程，避免一次拉取整年事件。 */
  showCalendarEvents: boolean;
  icsSources: IcsSource[];
}
