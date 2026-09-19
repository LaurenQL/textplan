import { App, PluginSettingTab, Setting } from "obsidian";
import type TextPlanPlugin from "../main";
import type { MessageKey } from "../i18n/messages";
import type { IcsSource } from "./types";

export class TextPlanSettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: TextPlanPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    const t = this.plugin.t;
    const settings = this.plugin.settings;

    containerEl.empty();

    new Setting(containerEl).setName(t("settingsCalendarSection")).setHeading();

    // 兼容设置
    new Setting(containerEl)
      .setName(t("settingsCompatWithDailyNotes"))
      .setDesc(t("settingsCompatWithDailyNotesDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(settings.compatWithDailyNotes)
          .onChange(async (value) => {
            settings.compatWithDailyNotes = value;
            await this.plugin.saveSettings();
            this.display(); // 重新渲染以更新禁用状态
          }),
      );

    // 日记目录（兼容模式下禁用）
    new Setting(containerEl)
      .setName(t("settingsDailyNoteDirectory"))
      .setDesc(t("settingsDailyNoteDirectoryDesc"))
      .addText((text) => {
        text
          .setValue(settings.dailyNoteDirectory)
          .setDisabled(settings.compatWithDailyNotes)
          .onChange(async (value) => {
            settings.dailyNoteDirectory = value.trim();
            await this.plugin.saveSettings();
          });
      });

    // 文件名格式（兼容模式下禁用）
    new Setting(containerEl)
      .setName(t("settingsFileNameFormat"))
      .setDesc(t("settingsFileNameFormatDesc"))
      .addText((text) => {
        text
          .setValue(settings.fileNameFormat)
          .setDisabled(settings.compatWithDailyNotes)
          .onChange(async (value) => {
            settings.fileNameFormat = value.trim();
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName(t("settingsMissingNoteBehavior"))
      .setDesc(t("settingsMissingNoteBehaviorDesc"))
      .addDropdown((dropdown) => {
        dropdown.addOption("create", t("settingsMissingNoteBehaviorCreate"));
        dropdown.addOption("ask", t("settingsMissingNoteBehaviorAsk"));
        dropdown.setValue(settings.missingNoteBehavior);
        dropdown.onChange(async (value) => {
          settings.missingNoteBehavior = value as "create" | "ask";
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName(t("settingsShowDateInTabTitle"))
      .setDesc(t("settingsShowDateInTabTitleDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(settings.showDateInTabTitle)
          .onChange(async (value) => {
            settings.showDateInTabTitle = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName(t("settingsHighlightActiveDailyNote"))
      .setDesc(t("settingsHighlightActiveDailyNoteDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(settings.highlightActiveDailyNote)
          .onChange(async (value) => {
            settings.highlightActiveDailyNote = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName(t("settingsWeekStartDay"))
      .setDesc(t("settingsWeekStartDayDesc"))
      .addDropdown((dropdown) => {
        getWeekStartOptions(t).forEach(([value, label]) => dropdown.addOption(value, label));
        dropdown.setValue(String(settings.weekStartDay));
        dropdown.onChange(async (value) => {
          settings.weekStartDay = Number(value);
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName(t("settingsDefaultCalendarMode"))
      .setDesc(t("settingsDefaultCalendarModeDesc"))
      .addDropdown((dropdown) => {
        dropdown.addOption("month", t("settingsCalendarModeMonth"));
        dropdown.addOption("week", t("settingsCalendarModeWeek"));
        dropdown.setValue(settings.defaultCalendarMode);
        dropdown.onChange(async (value) => {
          settings.defaultCalendarMode = value as "month" | "week";
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName(t("settingsWeekViewLayout"))
      .setDesc(t("settingsWeekViewLayoutDesc"))
      .addDropdown((dropdown) => {
        dropdown.addOption("vertical", t("settingsWeekViewLayoutVertical"));
        dropdown.addOption("horizontal", t("settingsWeekViewLayoutHorizontal"));
        dropdown.setValue(settings.weekViewLayout);
        dropdown.onChange(async (value) => {
          settings.weekViewLayout = value as "vertical" | "horizontal";
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl).setName(t("settingsTodoSection")).setHeading();

    // Todo 语法模式
    new Setting(containerEl)
      .setName(t("settingsTodoSyntaxMode"))
      .setDesc(t("settingsTodoSyntaxModeDesc"))
      .addDropdown((dropdown) => {
        dropdown.addOption("markdown", t("settingsTodoSyntaxMarkdown"));
        dropdown.addOption("asterisk", t("settingsTodoSyntaxAsterisk"));
        dropdown.addOption("custom", t("settingsTodoSyntaxCustom"));
        dropdown.setValue(settings.todoSyntax.mode);
        dropdown.onChange(async (value) => {
          settings.todoSyntax.mode = value as "markdown" | "asterisk" | "custom";
          await this.plugin.saveSettings();
          this.display(); // 重新渲染以显示/隐藏自定义输入框
        });
      });

    // 自定义标记（仅在自定义模式下显示）
    if (settings.todoSyntax.mode === "custom") {
      new Setting(containerEl)
        .setName(t("settingsCustomOpenMarker"))
        .setDesc(t("settingsCustomOpenMarkerDesc"))
        .addText((text) =>
          text
            .setValue(settings.todoSyntax.customOpen ?? "")
            .onChange(async (value) => {
              settings.todoSyntax.customOpen = value.trim();
              await this.plugin.saveSettings();
            }),
        );

      new Setting(containerEl)
        .setName(t("settingsCustomDoneMarker"))
        .setDesc(t("settingsCustomDoneMarkerDesc"))
        .addText((text) =>
          text
            .setValue(settings.todoSyntax.customDone ?? "")
            .onChange(async (value) => {
              settings.todoSyntax.customDone = value.trim();
              await this.plugin.saveSettings();
            }),
        );

      new Setting(containerEl)
        .setName(t("settingsCustomAbandonedMarker"))
        .setDesc(t("settingsCustomAbandonedMarkerDesc"))
        .addText((text) =>
          text
            .setValue(settings.todoSyntax.customAbandoned ?? "")
            .onChange(async (value) => {
              settings.todoSyntax.customAbandoned = value.trim();
              await this.plugin.saveSettings();
            }),
        );
    }

    new Setting(containerEl)
      .setName(t("settingsRecordCompletionTime"))
      .setDesc(t("settingsRecordCompletionTimeDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(settings.recordCompletionTime)
          .onChange(async (value) => {
            settings.recordCompletionTime = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl).setName(t("settingsEventsSection")).setHeading();

    new Setting(containerEl)
      .setName(t("settingsShowCalendarEvents"))
      .setDesc(t("settingsShowCalendarEventsDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(settings.showCalendarEvents)
          .onChange(async (value) => {
            settings.showCalendarEvents = value;
            await this.plugin.saveSettings();
            this.display();
          }),
      );

    if (settings.showCalendarEvents) {
      this.renderIcsSources(containerEl);
    }
  }

  private renderIcsSources(containerEl: HTMLElement): void {
    const t = this.plugin.t;
    const settings = this.plugin.settings;

    new Setting(containerEl)
      .setName(t("settingsIcsSources"))
      .setDesc(t("settingsIcsSourcesDesc"))
      .addButton((button) =>
        button.setButtonText(t("settingsIcsAddSource")).setCta().onClick(async () => {
          settings.icsSources.push({
            id: createSourceId(),
            name: `Calendar ${settings.icsSources.length + 1}`,
            url: "",
            enabled: true,
          });
          await this.plugin.saveSettings();
          this.display();
        }),
      );

    if (settings.icsSources.length === 0) {
      containerEl.createEl("p", { cls: "textplan-settings-empty", text: t("settingsIcsEmpty") });
      return;
    }

    settings.icsSources.forEach((source, index) => {
      const row = new Setting(containerEl).setClass("textplan-ics-source");

      row.addText((text) => {
        text
          .setPlaceholder(t("settingsIcsSourceName"))
          .setValue(source.name)
          .onChange(async (value) => {
            this.updateSource(source.id, { name: value.trim() });
            await this.plugin.saveSettings();
          });
        text.inputEl.addClass("textplan-ics-name");
      });

      row.addText((text) => {
        text
          .setPlaceholder(t("settingsIcsSourceUrl"))
          .setValue(source.url)
          .onChange(async (value) => {
            this.updateSource(source.id, { url: value.trim() });
            await this.plugin.saveSettings();
          });
        text.inputEl.addClass("textplan-ics-url");
      });

      row.addExtraButton((button) =>
        button
          .setIcon(source.enabled ? "check" : "x")
          .setTooltip(t("settingsIcsSourceEnabled"))
          .onClick(async () => {
            this.updateSource(source.id, { enabled: !source.enabled });
            await this.plugin.saveSettings();
            this.display();
          }),
      );

      row.addExtraButton((button) =>
        button
          .setIcon("trash")
          .setTooltip(t("settingsIcsRemoveSource"))
          .onClick(async () => {
            settings.icsSources.splice(index, 1);
            this.plugin.icsClient.invalidate();
            await this.plugin.saveSettings();
            this.display();
          }),
      );
    });
  }

  /** 按 id 改，避免输入框 onChange 时闭包里的 index 已经过期。 */
  private updateSource(id: string, patch: Partial<IcsSource>): void {
    const source = this.plugin.settings.icsSources.find((item) => item.id === id);
    if (!source) {
      return;
    }
    Object.assign(source, patch);
    this.plugin.icsClient.invalidate();
  }
}

function createSourceId(): string {
  return `ics-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function getWeekStartOptions(t: (key: MessageKey) => string): [string, string][] {
  return [
    ["0", t("weekdaySunday") as string],
    ["1", t("weekdayMonday") as string],
    ["2", t("weekdayTuesday") as string],
    ["3", t("weekdayWednesday") as string],
    ["4", t("weekdayThursday") as string],
    ["5", t("weekdayFriday") as string],
    ["6", t("weekdaySaturday") as string],
  ];
}
