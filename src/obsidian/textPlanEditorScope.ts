import { EditorView } from "@codemirror/view";
import { editorInfoField, TFile } from "obsidian";
import type { TextPlanSettings } from "../settings/types";
import { getDailyNotesConfig } from "./dailyNotesCompat";

export function createTextPlanEditorClass(
  getSettings: () => TextPlanSettings,
  getApp: () => any,
): ReturnType<typeof EditorView.editorAttributes.of> {
  return EditorView.editorAttributes.of((view) => {
    const info = view.state.field(editorInfoField, false);
    const file = info?.file;

    if (!isTextPlanDailyFile(file, getSettings(), getApp())) {
      return null;
    }

    return {
      class: "is-textplan-daily-note",
    };
  });
}

function isTextPlanDailyFile(file: TFile | null | undefined, settings: TextPlanSettings, app: any): boolean {
  if (!file) {
    return false;
  }

  // 兼容模式：检查 Daily Notes / Periodic Notes 插件配置的目录
  if (settings.compatWithDailyNotes) {
    const config = getDailyNotesConfig(app);
    if (config) {
      const folder = config.folder.replace(/^\/+|\/+$/g, "");
      // 如果插件配置了目录，检查文件是否在该目录下
      if (folder) {
        return file.path.startsWith(`${folder}/`);
      }
      // 如果插件没有配置目录，说明日记在根目录，检查文件名格式
      return file.path.match(/^\d{4}-\d{2}-\d{2}\.md$/) !== null || file.path.match(/^\d{8}\.md$/) !== null;
    }
  }

  // 非兼容模式：检查 TextPlan 自己的目录
  const directory = settings.dailyNoteDirectory.replace(/^\/+|\/+$/g, "");
  return directory ? file.path.startsWith(`${directory}/`) : true;
}
