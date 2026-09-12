import { ItemView, WorkspaceLeaf } from "obsidian";
import {
  addDays,
  addMonths,
  formatFullDate,
  formatMonthTitle,
  formatWeekRange,
  getWeekdayName,
  isSameDate,
  toDate,
  today,
  type PlainDate,
} from "../core/date";
import { TEXTPLAN_VIEW_TYPE } from "../constants";
import { createWeekGrid } from "../core/weekGrid";
import { createMonthGrid, getWeekdayLabels } from "../core/monthGrid";
import { getUnfinishedTodos } from "../core/todo";
import type { CalendarMode } from "../settings/types";
import type TextPlanPlugin from "../main";

interface DayEntry {
  todoList: HTMLDivElement;
  todoTexts: string[];
}

export class TextPlanView extends ItemView {
  private selectedDate: PlainDate = today();
  private viewMode: CalendarMode;
  private dayEntries: DayEntry[] = [];
  private resizeObserver: ResizeObserver | null = null;
  /** 当前展示的月份（月模式）或所在周的任意一天（周模式）。一屏只展示这一个周期。 */
  private displayedDate: PlainDate = today();

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

  private disconnectObservers(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }

  private async render(): Promise<void> {
    const container = this.containerEl.children[1] as HTMLElement;
    this.disconnectObservers();
    this.dayEntries = [];
    container.empty();
    container.addClass("textplan-view");
    this.renderToolbar(container);
    await this.renderCalendar(container);
    this.applyOverflowFolding();
    this.observeResize(container);
  }

  private renderToolbar(container: Element): void {
    const toolbar = container.createDiv({ cls: "textplan-toolbar" });
    const title = toolbar.createDiv({ cls: "textplan-title" });
    title.setText(this.formatTitle());

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
      await this.plugin.openDailyNote(this.selectedDate);
      await this.render();
    });

    const nextButton = controls.createEl("button", {
      cls: "textplan-icon-button",
      attr: { "aria-label": nextLabel, title: nextLabel },
    });
    nextButton.setText("›");
    this.registerDomEvent(nextButton, "click", () => this.shiftPeriod(1));

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
      await this.fillTodos(todoList, cell.date);
    }
  }

  /** 周模式·横向：1 行 × 7 列铺满可用高度，形态等同月视图的一行。 */
  private async renderWeekHorizontal(container: Element): Promise<void> {
    const calendar = container.createDiv({ cls: "textplan-calendar textplan-week-horizontal" });
    this.renderWeekdayHeader(calendar);
    for (const cell of createWeekGrid(this.startOfWeek(this.displayedDate), this.plugin.settings.weekStartDay)) {
      const { dayEl, todoList } = this.renderDayCell(calendar, cell.date, false);
      this.registerDayClick(dayEl, cell.date);
      await this.fillTodos(todoList, cell.date);
    }
  }

  /** 周模式·纵向：7 天上下均分可用高度，每天占满宽度，没有列头。 */
  private async renderWeekVertical(container: Element): Promise<void> {
    const calendar = container.createDiv({ cls: "textplan-calendar textplan-week-vertical" });
    for (const cell of createWeekGrid(this.startOfWeek(this.displayedDate), this.plugin.settings.weekStartDay)) {
      const { dayEl, todoList } = this.renderDayCell(calendar, cell.date, true);
      this.registerDayClick(dayEl, cell.date);
      await this.fillTodos(todoList, cell.date);
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

    const todoList = button.createDiv({ cls: "textplan-day-todos" }) as HTMLDivElement;
    return { dayEl: button, todoList };
  }

  private registerDayClick(dayEl: HTMLButtonElement, date: PlainDate): void {
    this.registerDomEvent(dayEl, "click", async () => {
      this.selectedDate = date;
      await this.plugin.openDailyNote(date);
      await this.render();
    });
  }

  private async fillTodos(todoList: HTMLDivElement, date: PlainDate): Promise<void> {
    const content = await this.plugin.vaultStore.readDailyNote(this.plugin.settings, date);
    const todoTexts = getUnfinishedTodos(content, this.plugin.settings.todoSyntax).map((todo) => todo.text);
    this.fillTodoList(todoList, todoTexts);
    this.dayEntries.push({ todoList, todoTexts });
  }

  private fillTodoList(todoList: HTMLDivElement, texts: string[]): void {
    todoList.empty();
    texts.forEach((text) => {
      const item = todoList.createDiv({ cls: "textplan-day-todo" });
      item.setText(text);
    });
  }

  private applyOverflowFolding(): void {
    this.dayEntries.forEach(({ todoList, todoTexts }) => {
      if (todoTexts.length === 0) return;
      this.fillTodoList(todoList, todoTexts);
      const firstItem = todoList.firstElementChild as HTMLElement | null;
      if (!firstItem) return;
      const itemHeight = firstItem.offsetHeight;
      const available = todoList.clientHeight;
      const gap = parseFloat(getComputedStyle(todoList).rowGap) || 0;
      if (itemHeight <= 0 || available <= 0) return;
      const maxRows = Math.max(1, Math.floor((available + gap) / (itemHeight + gap)));
      if (todoTexts.length <= maxRows) return;
      const shown = Math.max(0, maxRows - 1);
      this.fillTodoList(todoList, todoTexts.slice(0, shown));
      const more = todoList.createDiv({ cls: "textplan-day-todo textplan-day-todo-more" });
      more.setText(`+${todoTexts.length - shown}`);
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
