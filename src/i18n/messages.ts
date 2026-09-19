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
  | "weekdaySaturday"
  | "createNoteTitle"
  | "createNoteBody"
  | "createNotePath"
  | "createNoteConfirm"
  | "createNoteCancel"
  | "settingsMissingNoteBehavior"
  | "settingsMissingNoteBehaviorDesc"
  | "settingsMissingNoteBehaviorCreate"
  | "settingsMissingNoteBehaviorAsk"
  | "settingsShowDateInTabTitle"
  | "settingsShowDateInTabTitleDesc"
  | "settingsHighlightActiveDailyNote"
  | "settingsHighlightActiveDailyNoteDesc"
  | "settingsTodoSection"
  | "settingsCalendarSection"
  | "settingsEventsSection"
  | "settingsCustomAbandonedMarker"
  | "settingsCustomAbandonedMarkerDesc"
  | "settingsShowCalendarEvents"
  | "settingsShowCalendarEventsDesc"
  | "settingsIcsSources"
  | "settingsIcsSourcesDesc"
  | "settingsIcsSourceName"
  | "settingsIcsSourceUrl"
  | "settingsIcsSourceEnabled"
  | "settingsIcsAddSource"
  | "settingsIcsRemoveSource"
  | "settingsIcsEmpty"
  | "refreshCalendar"
  | "allDay"
  | "abandoned"
  | "abandonTodo"
  | "eventsFetchFailed";

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
    createNoteTitle: "新建日记文件",
    createNoteBody: "{date} 还没有对应的日记文件，是否新建？",
    createNotePath: "将创建：{path}",
    createNoteConfirm: "新建",
    createNoteCancel: "取消",
    settingsMissingNoteBehavior: "点击空白日期",
    settingsMissingNoteBehaviorDesc: "点击日历中还没有日记文件的日期时的行为。",
    settingsMissingNoteBehaviorCreate: "直接新建（默认）",
    settingsMissingNoteBehaviorAsk: "先弹窗询问",
    settingsShowDateInTabTitle: "在标签页显示日期",
    settingsShowDateInTabTitleDesc: "打开今天的日记文件时，在笔记标签页标题后追加日期和星期。",
    settingsHighlightActiveDailyNote: "跟随当前日记文件高亮",
    settingsHighlightActiveDailyNoteDesc: "打开符合命名规则的日记文件时，日历自动切到并高亮该日期。",
    settingsTodoSection: "Todo",
    settingsCalendarSection: "日记文件",
    settingsEventsSection: "日程订阅",
    settingsCustomAbandonedMarker: "自定义放弃标记",
    settingsCustomAbandonedMarkerDesc: "留空则使用「已完成标记 + x」，例如 ✓✓x。",
    settingsShowCalendarEvents: "在日历中显示日程",
    settingsShowCalendarEventsDesc: "只读展示 ICS 订阅中的日程，不写回订阅源。",
    settingsIcsSources: "日历订阅源",
    settingsIcsSourcesDesc: "支持 iCloud、飞书、Google Calendar 等公开的 ICS 订阅链接。",
    settingsIcsSourceName: "名称",
    settingsIcsSourceUrl: "ICS 链接",
    settingsIcsSourceEnabled: "启用",
    settingsIcsAddSource: "添加订阅源",
    settingsIcsRemoveSource: "删除",
    settingsIcsEmpty: "还没有订阅源。",
    refreshCalendar: "刷新日程",
    allDay: "全天",
    abandoned: "已放弃",
    abandonTodo: "放弃 Todo",
    eventsFetchFailed: "部分日程订阅拉取失败，正在显示缓存数据。",
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
    createNoteTitle: "Create daily note",
    createNoteBody: "No daily note exists for {date}. Create one?",
    createNotePath: "Will create: {path}",
    createNoteConfirm: "Create",
    createNoteCancel: "Cancel",
    settingsMissingNoteBehavior: "Clicking an empty date",
    settingsMissingNoteBehaviorDesc: "What happens when you click a date that has no daily note yet.",
    settingsMissingNoteBehaviorCreate: "Create immediately (default)",
    settingsMissingNoteBehaviorAsk: "Ask first",
    settingsShowDateInTabTitle: "Show date in tab title",
    settingsShowDateInTabTitleDesc: "Append the date and weekday to the tab title when the note is a daily note.",
    settingsHighlightActiveDailyNote: "Follow the active daily note",
    settingsHighlightActiveDailyNoteDesc: "When a daily note matching the naming rules is opened, the calendar switches to and highlights that date.",
    settingsTodoSection: "Todo",
    settingsCalendarSection: "Daily notes",
    settingsEventsSection: "Calendar subscriptions",
    settingsCustomAbandonedMarker: "Custom abandoned marker",
    settingsCustomAbandonedMarkerDesc: "Leave empty to use the done marker plus x, e.g. ✓✓x.",
    settingsShowCalendarEvents: "Show events in the calendar",
    settingsShowCalendarEventsDesc: "Read-only display of ICS subscriptions. Nothing is written back to the source.",
    settingsIcsSources: "Calendar sources",
    settingsIcsSourcesDesc: "Supports public ICS feeds from iCloud, Feishu, Google Calendar, and others.",
    settingsIcsSourceName: "Name",
    settingsIcsSourceUrl: "ICS URL",
    settingsIcsSourceEnabled: "Enabled",
    settingsIcsAddSource: "Add source",
    settingsIcsRemoveSource: "Remove",
    settingsIcsEmpty: "No sources yet.",
    refreshCalendar: "Refresh events",
    allDay: "All day",
    abandoned: "Abandoned",
    abandonTodo: "Abandon todo",
    eventsFetchFailed: "Some calendar sources failed to load. Showing cached data.",
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
