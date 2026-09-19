import { App, Modal, Setting } from "obsidian";
import { formatFullDate, type PlainDate } from "../core/date";
import type { MessageKey } from "../i18n/messages";

type Translate = (key: MessageKey, values?: Record<string, string | number>) => string;

export interface CreateDailyNotePromptOptions {
  date: PlainDate;
  /** 将要在 vault 里新建的文件路径，显示给用户看。 */
  path: string;
  locale: "zh" | "en";
  t: Translate;
  /** 弹窗关闭时回调：true 表示用户点了「新建」。Esc / 点遮罩一律按取消处理。 */
  onClose: (confirmed: boolean) => void;
}

/**
 * 点击还没有日记的日期格时的确认弹窗。
 *
 * 默认行为由 missingNoteBehavior 设置决定：设为「直接新建」时不会走到这里；
 * 设为「每次询问」时才弹这个窗。默认按钮是「新建」，符合「默认是直接新建」的口径。
 */
export class CreateDailyNoteModal extends Modal {
  private confirmed = false;

  constructor(app: App, private readonly options: CreateDailyNotePromptOptions) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    const t = this.options.t;

    contentEl.createEl("h3", { text: t("createNoteTitle") });
    contentEl.createEl("p", {
      text: t("createNoteBody", {
        date: formatFullDate(this.options.date, this.options.locale),
      }),
    });
    contentEl.createEl("p", {
      cls: "textplan-modal-path",
      text: this.options.path,
    });

    const buttons = new Setting(contentEl);
    buttons.settingEl.addClass("textplan-modal-buttons");

    buttons.addButton((button) =>
      button
        .setButtonText(t("createNoteConfirm"))
        .setCta()
        .onClick(() => {
          this.confirmed = true;
          this.close();
        }),
    );

    buttons.addButton((button) =>
      button.setButtonText(t("createNoteCancel")).onClick(() => this.close()),
    );
  }

  onClose(): void {
    const confirmed = this.confirmed;
    this.contentEl.empty();
    this.options.onClose(confirmed);
  }
}
