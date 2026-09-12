export type Locale = "zh" | "en";

export type MessageKey =
  | "archive"
  | "nextMonth"
  | "nextWeek"
  | "openTextPlan"
  | "previousMonth"
  | "previousWeek"
  | "settingsDailyNoteDirectory"
  | "settingsDailyNoteDirectoryDesc"
  | "settingsFileNameFormat"
  | "settingsFileNameFormatDesc"
  | "settingsRecordCompletionTime"
  | "settingsRecordCompletionTimeDesc"
  | "settingsWeekStartDay"
  | "settingsWeekStartDayDesc"
  | "settingsCompatWithDailyNotes"
  | "settingsCompatWithDailyNotesDesc"
  | "settingsTodoSyntaxMode"
  | "settingsTodoSyntaxModeDesc"
  | "settingsTodoSyntaxMarkdown"
  | "settingsTodoSyntaxAsterisk"
  | "settingsTodoSyntaxCustom"
  | "settingsCustomOpenMarker"
  | "settingsCustomOpenMarkerDesc"
  | "settingsCustomDoneMarker"
  | "settingsCustomDoneMarkerDesc"
  | "today"
  | "toggleTodo"
  | "archiveCompletedTodos"
  | "noActiveMarkdownFile"
  | "archivedCount"
  | "hotkeyConflict"
  | "calendarModeMonth"
  | "calendarModeWeek"
  | "settingsDefaultCalendarMode"
  | "settingsDefaultCalendarModeDesc"
  | "settingsCalendarModeMonth"
  | "settingsCalendarModeWeek"
  | "settingsWeekViewLayout"
  | "settingsWeekViewLayoutDesc"
  | "settingsWeekViewLayoutVertical"
  | "settingsWeekViewLayoutHorizontal"
  | "weekdaySunday"
  | "weekdayMonday"
  | "weekdayTuesday"
  | "weekdayWednesday"
  | "weekdayThursday"
  | "weekdayFriday"
  | "weekdaySaturday";

const messages: Record<Locale, Record<MessageKey, string>> = {
  zh: {
    archive: "归档",
    nextMonth: "下个月",
    nextWeek: "下一周",
    openTextPlan: "打开 TextPlan",
    previousMonth: "上个月",
    previousWeek: "上一周",
    settingsDailyNoteDirectory: "日记目录",
    settingsDailyNoteDirectoryDesc: "相对于当前 vault 的目录路径。",
    settingsFileNameFormat: "文件名格式",
    settingsFileNameFormatDesc: "支持 YYYY、MM、DD token。",
    settingsRecordCompletionTime: "完成时记录时间",
    settingsRecordCompletionTimeDesc: "完成 todo 时追加 @done(YYYY-MM-DD)。",
    settingsWeekStartDay: "周起始日",
    settingsWeekStartDayDesc: "月历每周从哪一天开始。",
    settingsCompatWithDailyNotes: "兼容 Obsidian 日记插件",
    settingsCompatWithDailyNotesDesc: "开启后从 Daily Notes / Periodic Notes 插件读取配置（目录、日期格式、模板）。",
    settingsTodoSyntaxMode: "Todo 语法模式",
    settingsTodoSyntaxModeDesc: "选择 todo 标记语法。",
    settingsTodoSyntaxMarkdown: "Markdown 原生",
    settingsTodoSyntaxAsterisk: "星号",
    settingsTodoSyntaxCustom: "自定义",
    settingsCustomOpenMarker: "自定义未完成标记",
    settingsCustomOpenMarkerDesc: "例如：>>",
    settingsCustomDoneMarker: "自定义已完成标记",
    settingsCustomDoneMarkerDesc: "例如：✓✓",
    today: "今天",
    toggleTodo: "切换 Todo 状态",
    archiveCompletedTodos: "归档已完成 Todo",
    noActiveMarkdownFile: "没有活动的 Markdown 文件",
    archivedCount: "已归档 {count} 个 todo",
    hotkeyConflict: "TextPlan: CMD+SHIFT+T 快捷键与其他命令冲突，已跳过注册。请在快捷键设置中手动绑定「打开 TextPlan」。",
    calendarModeMonth: "月",
    calendarModeWeek: "周",
    settingsDefaultCalendarMode: "默认日历模式",
    settingsDefaultCalendarModeDesc: "插件启动时的日历模式。",
    settingsCalendarModeMonth: "月视图",
    settingsCalendarModeWeek: "周视图",
    settingsWeekViewLayout: "周视图布局",
    settingsWeekViewLayoutDesc: "横向（默认）：7 天排成一行，与月视图一致。纵向：每天占满面板宽度，窄侧边栏下更易读。",
    settingsWeekViewLayoutVertical: "纵向",
    settingsWeekViewLayoutHorizontal: "横向（默认）",
    weekdaySunday: "周日",
    weekdayMonday: "周一",
    weekdayTuesday: "周二",
    weekdayWednesday: "周三",
    weekdayThursday: "周四",
    weekdayFriday: "周五",
    weekdaySaturday: "周六",
  },
  en: {
    archive: "Archive",
    nextMonth: "Next month",
    nextWeek: "Next week",
    openTextPlan: "Open TextPlan",
    previousMonth: "Previous month",
    previousWeek: "Previous week",
    settingsDailyNoteDirectory: "Daily note directory",
    settingsDailyNoteDirectoryDesc: "Directory path relative to the current vault.",
    settingsFileNameFormat: "File name format",
    settingsFileNameFormatDesc: "Supports YYYY, MM, and DD tokens.",
    settingsRecordCompletionTime: "Record completion time",
    settingsRecordCompletionTimeDesc: "Append @done(YYYY-MM-DD) when completing a todo.",
    settingsWeekStartDay: "Week start day",
    settingsWeekStartDayDesc: "The first day of the week in the calendar.",
    settingsCompatWithDailyNotes: "Compatible with Obsidian Daily Notes",
    settingsCompatWithDailyNotesDesc: "Read configuration (directory, date format, template) from Daily Notes / Periodic Notes plugin.",
    settingsTodoSyntaxMode: "Todo syntax mode",
    settingsTodoSyntaxModeDesc: "Choose the todo marker syntax.",
    settingsTodoSyntaxMarkdown: "Markdown native",
    settingsTodoSyntaxAsterisk: "Asterisk",
    settingsTodoSyntaxCustom: "Custom",
    settingsCustomOpenMarker: "Custom open marker",
    settingsCustomOpenMarkerDesc: "Example: >>",
    settingsCustomDoneMarker: "Custom done marker",
    settingsCustomDoneMarkerDesc: "Example: ✓✓",
    today: "Today",
    toggleTodo: "Toggle todo status",
    archiveCompletedTodos: "Archive completed todos",
    noActiveMarkdownFile: "No active Markdown file",
    archivedCount: "Archived {count} todo(s)",
    hotkeyConflict: "TextPlan: CMD+SHIFT+T conflicts with another command. The default hotkey was skipped — please bind \"Open TextPlan\" manually in Hotkeys settings.",
    calendarModeMonth: "Month",
    calendarModeWeek: "Week",
    settingsDefaultCalendarMode: "Default calendar mode",
    settingsDefaultCalendarModeDesc: "Calendar mode when the plugin starts.",
    settingsCalendarModeMonth: "Month view",
    settingsCalendarModeWeek: "Week view",
    settingsWeekViewLayout: "Week view layout",
    settingsWeekViewLayoutDesc: "Horizontal (default): 7 days in one row, same as month view. Vertical: each day spans full panel width, easier to read in a narrow sidebar.",
    settingsWeekViewLayoutVertical: "Vertical",
    settingsWeekViewLayoutHorizontal: "Horizontal (default)",
    weekdaySunday: "Sunday",
    weekdayMonday: "Monday",
    weekdayTuesday: "Tuesday",
    weekdayWednesday: "Wednesday",
    weekdayThursday: "Thursday",
    weekdayFriday: "Friday",
    weekdaySaturday: "Saturday",
  },
};

export function detectLocale(language?: string): Locale {
  return language?.toLowerCase().startsWith("zh") ? "zh" : "en";
}

export function createTranslator(locale: Locale): (key: MessageKey, values?: Record<string, string | number>) => string {
  return (key, values = {}) => {
    let message = messages[locale][key];
    Object.entries(values).forEach(([name, value]) => {
      message = message.replaceAll(`{${name}}`, String(value));
    });
    return message;
  };
}
