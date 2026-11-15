import { ItemView, WorkspaceLeaf } from "obsidian";
import {
  addDays,
  addMonths,
  formatFullDate,
  formatIsoDate,
  formatMonthTitle,
  formatShortDateWithWeekday,
  formatWeekRange,
  getWeekdayName,
  isSameDate,
  toDate,
  today,
  type PlainDate,
} from "../core/date";
import { EVENT_TITLE_MAX_LENGTH, TEXTPLAN_VIEW_TYPE } from "../constants";
import { createWeekGrid } from "../core/weekGrid";
import { createMonthGrid, getWeekdayLabels } from "../core/monthGrid";
import { dateKey, type CalendarEvent } from "../core/ics";
import { getCalendarTodos, type ParsedTodo } from "../core/todo";
import { getMonthWindow } from "../obsidian/icsClient";
import type { CalendarMode, TodoState } from "../settings/types";
import type TextPlanPlugin from "../main";

/** 日历格里一行任务。已完成的任务仍然显示，但用弱化样式。 */
interface TodoRow {
  text: string;
  state: TodoState;
}

interface DayEntry {
  todoList: HTMLDivElement;
  rows: TodoRow[];
}

export class TextPlanView extends ItemView {
  private selectedDate: PlainDate = today();
  private viewMode: CalendarMode;
  private dayEntries: DayEntry[] = [];
  private resizeObserver: ResizeObserver | null = null;
  /** 当前展示的月份（月模式）或所在周的任意一天（周模式）。一屏只展示这一个周期。 */
  private displayedDate: PlainDate = today();
  /** 按日期键索引的日程，来自 ICS 订阅。空 Map 表示没有订阅或还没拉到。 */
  private eventsByDate = new Map<string, CalendarEvent[]>();
  private lastRefresh = 0;
  private icsFailed = false;

  constructor(leaf: WorkspaceLeaf, private readonly plugin: TextPlanPlugin) {
    super(leaf);
    this.viewMode = plugin.settings.defaultCalendarMode;
  }

  getViewType(): string {
    return TEXTPLAN_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "TextPlan";
  }

  getIcon(): string {
    return "calendar-days";
  }

  async onOpen(): Promise<void> {
    await this.render();
  }

  async refresh(): Promise<void> {
    await this.render();
  }

  async onClose(): Promise<void> {
    this.disconnectObservers();
  }

  /**
   * 外部（打开日记文件时）要求把日历切到某一天。
   *
   * 已经选中且已经显示这一天时不重绘 —— 否则每次在编辑器里切换光标所在的
   * 同一个文件都会触发整页重绘。
   */
  async focusDate(date: PlainDate): Promise<void> {
    const sameSelection = isSameDate(this.selectedDate, date);
    const shownPeriod = this.viewMode === "month"
      ? this.startOfMonth(date)
      : this.startOfWeek(date);
    const samePeriod = this.viewMode === "month"
      ? isSameDate(this.startOfMonth(this.displayedDate), shownPeriod)
      : isSameDate(this.startOfWeek(this.displayedDate), shownPeriod);
    if (sameSelection && samePeriod) {
      return;
    }
    this.selectedDate = date;
    this.displayedDate = shownPeriod;
    await this.render();
  }

  private disconnectObservers(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }

  private async render(): Promise<void> {
    const container = this.containerEl.children[1] as HTMLElement;
    this.disconnectObservers();
    this.dayEntries = [];
    await this.plugin.datedTodoIndex.refresh(this.plugin.settings);
    await this.loadEvents();
    container.empty();
    container.addClass("textplan-view");
    this.renderToolbar(container);
    await this.renderCalendar(container);
    this.applyOverflowFolding();
    this.observeResize(container);
  }

  /** 只拉当前显示周期内的日程。失败时保留上一次的数据，不把日历清空。 */
  private async loadEvents(): Promise<void> {
    if (!this.plugin.settings.showCalendarEvents || this.plugin.settings.icsSources.length === 0) {
      this.eventsByDate = new Map();
      this.icsFailed = false;
      return;
    }

    const window = this.viewMode === "month"
      ? getMonthWindow(this.displayedDate)
      : { start: this.startOfWeek(this.displayedDate), end: addDays(this.startOfWeek(this.displayedDate), 6) };

    const result = await this.plugin.icsClient.fetchEvents(this.plugin.settings.icsSources, window.start, window.end);
    this.eventsByDate = result.eventsByDate;
    this.lastRefresh = result.fetchedAt;
    this.icsFailed = result.errors.length > 0;
  }

  private renderToolbar(container: Element): void {
    const toolbar = container.createDiv({ cls: "textplan-toolbar" });
    const titleGroup = toolbar.createDiv({ cls: "textplan-title-group" });
    const title = titleGroup.createDiv({ cls: "textplan-title" });
    title.setText(this.formatTitle());
    // 副标题：当前选中日期 + 星期几，让用户一眼知道今天是星期几
    const subtitle = titleGroup.createDiv({ cls: "textplan-subtitle" });
    subtitle.setText(formatShortDateWithWeekday(this.selectedDate, this.plugin.locale));

    const controls = toolbar.createDiv({ cls: "textplan-controls" });
    const modeSegment = controls.createDiv({ cls: "textplan-segment" });
    const monthButton = modeSegment.createEl("button", { cls: "textplan-segment-btn" });
    monthButton.setText(this.plugin.t("calendarModeMonth"));
    if (this.viewMode === "month") monthButton.addClass("is-active");
    const weekButton = modeSegment.createEl("button", { cls: "textplan-segment-btn" });
    weekButton.setText(this.plugin.t("calendarModeWeek"));
    if (this.viewMode === "week") weekButton.addClass("is-active");

    // 切换模式时重置到当前月 / 当前周
    this.registerDomEvent(monthButton, "click", async () => {
      if (this.viewMode === "month") return;
      this.viewMode = "month";
      this.displayedDate = this.startOfMonth(today());
      await this.render();
    });
    this.registerDomEvent(weekButton, "click", async () => {
      if (this.viewMode === "week") return;
      this.viewMode = "week";
      this.displayedDate = this.startOfWeek(today());
      await this.render();
    });

    const previousLabel = this.plugin.t(this.viewMode === "month" ? "previousMonth" : "previousWeek");
    const nextLabel = this.plugin.t(this.viewMode === "month" ? "nextMonth" : "nextWeek");

    const previousButton = controls.createEl("button", {
      cls: "textplan-icon-button",
      attr: { "aria-label": previousLabel, title: previousLabel },
    });
    previousButton.setText("‹");
    this.registerDomEvent(previousButton, "click", () => this.shiftPeriod(-1));

    const todayButton = controls.createEl("button", { cls: "textplan-button" });
    todayButton.setText(this.plugin.t("today"));
    this.registerDomEvent(todayButton, "click", async () => {
      this.selectedDate = today();
      this.displayedDate = this.viewMode === "month" ? this.startOfMonth(this.selectedDate) : this.startOfWeek(this.selectedDate);
      await this.plugin.openToday();
      await this.render();
    });

    const nextButton = controls.createEl("button", {
      cls: "textplan-icon-button",
      attr: { "aria-label": nextLabel, title: nextLabel },
    });
    nextButton.setText("›");
    this.registerDomEvent(nextButton, "click", () => this.shiftPeriod(1));

    // 有日历订阅时给一个手动刷新入口
    if (this.plugin.settings.showCalendarEvents && this.plugin.settings.icsSources.length > 0) {
      const refreshButton = controls.createEl("button", {
        cls: "textplan-icon-button",
        attr: { "aria-label": this.plugin.t("refreshCalendar"), title: this.plugin.t("refreshCalendar") },
      });
      refreshButton.setText("⟳");
      if (this.icsFailed) refreshButton.addClass("is-warning");
      this.registerDomEvent(refreshButton, "click", async () => {
        this.plugin.icsClient.invalidate();
        await this.render();
      });
    }

    const archiveButton = controls.createEl("button", { cls: "textplan-button" });
    archiveButton.setText(this.plugin.t("archive"));
    this.registerDomEvent(archiveButton, "click", async () => {
      await this.plugin.archiveActiveFile();
      await this.render();
    });
  }

  private formatTitle(): string {
    if (this.viewMode === "month") {
      return formatMonthTitle(this.displayedDate, this.plugin.locale);
    }
    const start = this.startOfWeek(this.displayedDate);
    return formatWeekRange(start, addDays(start, 6), this.plugin.locale);
  }

  private async shiftPeriod(delta: number): Promise<void> {
    this.displayedDate = this.viewMode === "month"
      ? addMonths(this.displayedDate, delta)
      : addDays(this.startOfWeek(this.displayedDate), delta * 7);
    await this.render();
  }

  private async renderCalendar(container: Element): Promise<void> {
    if (this.viewMode === "month") {
      await this.renderMonth(container);
      return;
    }
    if (this.plugin.settings.weekViewLayout === "vertical") {
      await this.renderWeekVertical(container);
      return;
    }
    await this.renderWeekHorizontal(container);
  }

  /** 月模式：6 行 × 7 列铺满可用高度，一屏一个月，不滚动。 */
  private async renderMonth(container: Element): Promise<void> {
    const calendar = container.createDiv({ cls: "textplan-calendar textplan-month-grid" });
    this.renderWeekdayHeader(calendar);
    const monthStart = this.startOfMonth(this.displayedDate);
    for (const cell of createMonthGrid(monthStart, this.plugin.settings.weekStartDay)) {
      const { dayEl, todoList } = this.renderDayCell(calendar, cell.date, false);
      if (!cell.inCurrentMonth) dayEl.addClass("is-outside-month");
      this.registerDayClick(dayEl, cell.date);
      await this.fillTodos(dayEl, todoList, cell.date);
    }
  }

  /** 周模式·横向：1 行 × 7 列铺满可用高度，形态等同月视图的一行。 */
  private async renderWeekHorizontal(container: Element): Promise<void> {
    const calendar = container.createDiv({ cls: "textplan-calendar textplan-week-horizontal" });
    this.renderWeekdayHeader(calendar);
    for (const cell of createWeekGrid(this.startOfWeek(this.displayedDate), this.plugin.settings.weekStartDay)) {
      const { dayEl, todoList } = this.renderDayCell(calendar, cell.date, false);
      this.registerDayClick(dayEl, cell.date);
      await this.fillTodos(dayEl, todoList, cell.date);
    }
  }

  /** 周模式·纵向：7 天上下均分可用高度，每天占满宽度，没有列头。 */
  private async renderWeekVertical(container: Element): Promise<void> {
    const calendar = container.createDiv({ cls: "textplan-calendar textplan-week-vertical" });
    for (const cell of createWeekGrid(this.startOfWeek(this.displayedDate), this.plugin.settings.weekStartDay)) {
      const { dayEl, todoList } = this.renderDayCell(calendar, cell.date, true);
      this.registerDayClick(dayEl, cell.date);
      await this.fillTodos(dayEl, todoList, cell.date);
    }
  }

  private renderWeekdayHeader(calendar: HTMLElement): void {
    const labels = getWeekdayLabels(this.plugin.settings.weekStartDay, this.plugin.locale);
    labels.forEach((label) => calendar.createDiv({ cls: "textplan-weekday", text: label }));
  }

  private renderDayCell(
    parent: Element,
    date: PlainDate,
    vertical: boolean,
  ): { dayEl: HTMLButtonElement; todoList: HTMLDivElement } {
    const button = parent.createEl("button", {
      cls: vertical ? "textplan-day textplan-day--full-width" : "textplan-day",
      attr: { "aria-label": formatFullDate(date, this.plugin.locale) },
    });
    if (isSameDate(date, this.selectedDate)) button.addClass("is-selected");
    if (isSameDate(date, today())) button.addClass("is-today");

    if (vertical) {
      // 纵向布局没有列头，星期名与日期数字并排显示在每行内
      const header = button.createDiv({ cls: "textplan-day-header" });
      header.createDiv({ cls: "textplan-day-number", text: String(date.day) });
      header.createDiv({ cls: "textplan-day-weekday", text: getWeekdayName(date, this.plugin.locale) });
    } else {
      button.createDiv({ cls: "textplan-day-number", text: String(date.day) });
    }

    this.renderEvents(button, date);
    if (this.eventsByDate.has(dateKey(date))) {
      button.addClass("has-content");
    }

    const todoList = button.createDiv({ cls: "textplan-day-todos" }) as HTMLDivElement;
    return { dayEl: button, todoList };
  }

  /** 日程条目只读展示，排在 todo 之前，整体不参与 todo 的溢出折叠。 */
  private renderEvents(button: HTMLElement, date: PlainDate): void {
    const events = this.eventsByDate.get(dateKey(date));
    if (!events || events.length === 0) {
      return;
    }

    const list = button.createDiv({ cls: "textplan-day-events" });
    for (const event of events) {
      const item = list.createDiv({ cls: "textplan-day-event" });
      const time = event.allDay ? "" : event.startTime;
      if (time) {
        item.createSpan({ cls: "textplan-day-event-time", text: time });
      }
      const title = event.summary.length > EVENT_TITLE_MAX_LENGTH
        ? `${event.summary.slice(0, EVENT_TITLE_MAX_LENGTH - 1)}…`
        : event.summary;
      item.createSpan({ cls: "textplan-day-event-title", text: title });
      const tooltip = [
        event.summary,
        event.location,
        event.allDay ? this.plugin.t("allDay") : `${event.startTime}${event.endTime ? `–${event.endTime}` : ""}`,
        event.sourceName,
      ].filter((part) => part.length > 0).join("\n");
      item.setAttr("title", tooltip);
    }
  }

  private registerDayClick(dayEl: HTMLButtonElement, date: PlainDate): void {
    this.registerDomEvent(dayEl, "click", async () => {
      this.selectedDate = date;
      await this.plugin.openDailyNote(date);
      await this.render();
    });
  }

  /**
   * 收集某一天要显示的任务：本文件的 todo + 其他日记里用 `### 日期` 分组过来的
   * todo。本文件里已经归到 `###` 日期标题下的行不重复出现在文件自己那一天。
   */
  private async fillTodos(dayEl: HTMLButtonElement, todoList: HTMLDivElement, date: PlainDate): Promise<void> {
    const settings = this.plugin.settings;
    const content = await this.plugin.vaultStore.readDailyNote(settings, date);
    const file = this.plugin.vaultStore.findDailyNoteFile(settings, date);
    const datedLines = file ? this.plugin.datedTodoIndex.getDatedLineNumbers(file) : new Set<number>();

    const own = getCalendarTodos(content, settings.todoSyntax)
      .filter((todo) => !datedLines.has(todo.lineNumber))
      .map(toRow);
    const dated = this.plugin.datedTodoIndex
      .getTodosForDate(formatIsoDate(date))
      .filter((todo) => todo.state !== "abandoned")
      .map(toRow);

    // 未完成排在已完成前面，同状态内保持文件顺序
    const rows = [...own, ...dated].sort((a, b) => Number(a.state !== "open") - Number(b.state !== "open"));
    this.fillTodoList(todoList, rows);
    this.dayEntries.push({ todoList, rows });
    if (rows.length > 0) {
      dayEl.addClass("has-content");
    }
  }

  private fillTodoList(todoList: HTMLDivElement, rows: TodoRow[]): void {
    todoList.empty();
    rows.forEach((row) => {
      const item = todoList.createDiv({ cls: "textplan-day-todo" });
      if (row.state === "done") {
        item.addClass("is-done");
      }
      item.setText(row.text);
    });
  }

  private applyOverflowFolding(): void {
    this.dayEntries.forEach(({ todoList, rows }) => {
      if (rows.length === 0) return;
      this.fillTodoList(todoList, rows);
      const firstItem = todoList.firstElementChild as HTMLElement | null;
      if (!firstItem) return;
      const itemHeight = firstItem.offsetHeight;
      const available = todoList.clientHeight;
      const gap = parseFloat(getComputedStyle(todoList).rowGap) || 0;
      if (itemHeight <= 0 || available <= 0) return;
      const maxRows = Math.max(1, Math.floor((available + gap) / (itemHeight + gap)));
      if (rows.length <= maxRows) return;
      const shown = Math.max(0, maxRows - 1);
      this.fillTodoList(todoList, rows.slice(0, shown));
      const more = todoList.createDiv({ cls: "textplan-day-todo textplan-day-todo-more" });
      more.setText(`+${rows.length - shown}`);
    });
  }

  private observeResize(container: Element): void {
    if (typeof ResizeObserver === "undefined") return;
    this.resizeObserver = new ResizeObserver(() => this.applyOverflowFolding());
    this.resizeObserver.observe(container);
  }

  private startOfMonth(date: PlainDate): PlainDate {
    return { year: date.year, month: date.month, day: 1 };
  }

  private startOfWeek(date: PlainDate): PlainDate {
    const weekday = toDate(date).getDay();
    const offset = (weekday - this.plugin.settings.weekStartDay + 7) % 7;
    return addDays(date, -offset);
  }
}

function toRow(todo: ParsedTodo): TodoRow {
  return { text: todo.text, state: todo.state };
}
