import { App, PluginSettingTab, Setting } from "obsidian";
import type TextPlanPlugin from "../main";
import type { MessageKey } from "../i18n/messages";

export class TextPlanSettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: TextPlanPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    const t = this.plugin.t;

    containerEl.empty();

    // 兼容设置
    new Setting(containerEl)
      .setName(t("settingsCompatWithDailyNotes"))
      .setDesc(t("settingsCompatWithDailyNotesDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.compatWithDailyNotes)
          .onChange(async (value) => {
            this.plugin.settings.compatWithDailyNotes = value;
            await this.plugin.saveSettings();
            this.display(); // 重新渲染以更新禁用状态
          }),
      );

    // Todo 语法模式
    new Setting(containerEl)
      .setName(t("settingsTodoSyntaxMode"))
      .setDesc(t("settingsTodoSyntaxModeDesc"))
      .addDropdown((dropdown) => {
        dropdown.addOption("markdown", t("settingsTodoSyntaxMarkdown"));
        dropdown.addOption("asterisk", t("settingsTodoSyntaxAsterisk"));
        dropdown.addOption("custom", t("settingsTodoSyntaxCustom"));
        dropdown.setValue(this.plugin.settings.todoSyntax.mode);
        dropdown.onChange(async (value) => {
          this.plugin.settings.todoSyntax.mode = value as "markdown" | "asterisk" | "custom";
          await this.plugin.saveSettings();
          this.display(); // 重新渲染以显示/隐藏自定义输入框
        });
      });

    // 自定义未完成标记（仅在自定义模式下显示）
    if (this.plugin.settings.todoSyntax.mode === "custom") {
      new Setting(containerEl)
        .setName(t("settingsCustomOpenMarker"))
        .setDesc(t("settingsCustomOpenMarkerDesc"))
        .addText((text) =>
          text
            .setValue(this.plugin.settings.todoSyntax.customOpen ?? "")
            .onChange(async (value) => {
              this.plugin.settings.todoSyntax.customOpen = value.trim();
              await this.plugin.saveSettings();
            }),
        );

      new Setting(containerEl)
        .setName(t("settingsCustomDoneMarker"))
        .setDesc(t("settingsCustomDoneMarkerDesc"))
        .addText((text) =>
          text
            .setValue(this.plugin.settings.todoSyntax.customDone ?? "")
            .onChange(async (value) => {
              this.plugin.settings.todoSyntax.customDone = value.trim();
              await this.plugin.saveSettings();
            }),
        );
    }

    // 日记目录（兼容模式下禁用）
    new Setting(containerEl)
      .setName(t("settingsDailyNoteDirectory"))
      .setDesc(t("settingsDailyNoteDirectoryDesc"))
      .addText((text) => {
        text
          .setValue(this.plugin.settings.dailyNoteDirectory)
          .setDisabled(this.plugin.settings.compatWithDailyNotes)
          .onChange(async (value) => {
            this.plugin.settings.dailyNoteDirectory = value.trim();
            await this.plugin.saveSettings();
          });
      });

    // 文件名格式（兼容模式下禁用）
    new Setting(containerEl)
      .setName(t("settingsFileNameFormat"))
      .setDesc(t("settingsFileNameFormatDesc"))
      .addText((text) => {
        text
          .setValue(this.plugin.settings.fileNameFormat)
          .setDisabled(this.plugin.settings.compatWithDailyNotes)
          .onChange(async (value) => {
            this.plugin.settings.fileNameFormat = value.trim();
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName(t("settingsWeekStartDay"))
      .setDesc(t("settingsWeekStartDayDesc"))
      .addDropdown((dropdown) => {
        getWeekStartOptions(t).forEach(([value, label]) => dropdown.addOption(value, label));
        dropdown.setValue(String(this.plugin.settings.weekStartDay));
        dropdown.onChange(async (value) => {
          this.plugin.settings.weekStartDay = Number(value);
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName(t("settingsDefaultCalendarMode"))
      .setDesc(t("settingsDefaultCalendarModeDesc"))
      .addDropdown((dropdown) => {
        dropdown.addOption("month", t("settingsCalendarModeMonth"));
        dropdown.addOption("week", t("settingsCalendarModeWeek"));
        dropdown.setValue(this.plugin.settings.defaultCalendarMode);
        dropdown.onChange(async (value) => {
          this.plugin.settings.defaultCalendarMode = value as "month" | "week";
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName(t("settingsWeekViewLayout"))
      .setDesc(t("settingsWeekViewLayoutDesc"))
      .addDropdown((dropdown) => {
        dropdown.addOption("vertical", t("settingsWeekViewLayoutVertical"));
        dropdown.addOption("horizontal", t("settingsWeekViewLayoutHorizontal"));
        dropdown.setValue(this.plugin.settings.weekViewLayout);
        dropdown.onChange(async (value) => {
          this.plugin.settings.weekViewLayout = value as "vertical" | "horizontal";
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName(t("settingsRecordCompletionTime"))
      .setDesc(t("settingsRecordCompletionTimeDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.recordCompletionTime)
          .onChange(async (value) => {
            this.plugin.settings.recordCompletionTime = value;
            await this.plugin.saveSettings();
          }),
      );
  }
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
