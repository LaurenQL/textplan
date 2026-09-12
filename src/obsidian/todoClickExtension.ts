import { EditorView } from "@codemirror/view";
import { toggleTodoLine } from "../core/todoToggle";
import type { TextPlanSettings } from "../settings/types";

export function createTodoClickExtension(
  getSettings: () => TextPlanSettings,
  getDoneDate: () => string,
  onChanged: () => void,
): ReturnType<typeof EditorView.domEventHandlers> {
  return EditorView.domEventHandlers({
    mousedown(event, view) {
      const position = view.posAtCoords({ x: event.clientX, y: event.clientY });
      if (position === null) {
        return false;
      }

      const line = view.state.doc.lineAt(position);
      const lineText = line.text;
      const settings = getSettings();
      const markerRange = getClickableMarkerRange(lineText, settings.todoSyntax.mode);
      if (!markerRange) {
        return false;
      }

      const offset = position - line.from;
      if (offset < markerRange.from || offset >= markerRange.to) {
        return false;
      }

      const nextLine = toggleTodoLine(lineText, {
        recordCompletionTime: settings.recordCompletionTime,
        doneDate: getDoneDate(),
        syntaxConfig: settings.todoSyntax,
      });

      if (nextLine === lineText) {
        return false;
      }

      view.dispatch({
        changes: {
          from: line.from,
          to: line.to,
          insert: nextLine,
        },
      });
      onChanged();
      event.preventDefault();
      return true;
    },
  });
}

function getClickableMarkerRange(line: string, mode: "markdown" | "asterisk" | "custom"): { from: number; to: number } | null {
  if (mode === "markdown") {
    const match = /^(\s*)-\s+\[[ xX]\]/.exec(line);
    if (!match) {
      return null;
    }
    const from = match[1].length;
    return { from, to: match[0].length };
  }

  if (mode === "asterisk") {
    const match = /^(\s*)\*(?:\s*✓|\[x\])?/i.exec(line);
    if (!match) {
      return null;
    }
    const from = match[1].length;
    return { from, to: match[0].length };
  }

  // 自定义模式暂不支持点击（需要用户提供的标记才能识别）
  return null;
}
